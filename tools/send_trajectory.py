#!/usr/bin/env python3
"""Send the six-vessel CETUS trajectory to a Tauri receiver over UDP."""

from __future__ import annotations

import argparse
import csv
import json
import math
import socket
import time
import uuid
from collections.abc import Iterator, Mapping, Sequence
from pathlib import Path
from typing import TypeAlias

Point: TypeAlias = tuple[float, float]
Trajectories: TypeAlias = dict[str, list[Point]]

DEFAULT_PORT = 5005
DEFAULT_HZ = 20.0
MAX_DATAGRAM_BYTES = 1400
FLEET_IDS = tuple(f"USV-{index}" for index in range(1, 7))
TRAJECTORY_FILES = {
    "USV-1": "trajectory3对应虚拟节点1.csv",
    "USV-2": "trajectory1对应USV2.csv",
    "USV-3": "trajectory2对应USV3.csv",
    "USV-4": "trajectory5对应USV4.csv",
    "USV-5": "trajectory6对应USV5.csv",
    "USV-6": "trajectory4对应虚拟节点6.csv",
}
DEFAULT_TRAJECTORY_DIR = (
    Path(__file__).resolve().parents[1] / "assets" / "trajecytory"
)


def load_csv(path: Path) -> list[Point]:
    points: list[Point] = []
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames is None or not {"x", "y"}.issubset(reader.fieldnames):
            raise ValueError(f"{path} must contain x and y columns")
        for row_number, row in enumerate(reader, start=2):
            try:
                x = float(row["x"])
                y = float(row["y"])
            except (TypeError, ValueError) as error:
                raise ValueError(f"{path}:{row_number} has invalid coordinates") from error
            if not math.isfinite(x) or not math.isfinite(y):
                raise ValueError(f"{path}:{row_number} contains a non-finite coordinate")
            points.append((x, y))
    if not points:
        raise ValueError(f"{path} contains no trajectory points")
    return points


def load_trajectories(directory: Path) -> Trajectories:
    trajectories = {
        vessel_id: load_csv(directory / filename)
        for vessel_id, filename in TRAJECTORY_FILES.items()
    }
    lengths = {len(points) for points in trajectories.values()}
    if len(lengths) != 1:
        detail = ", ".join(
            f"{vessel_id}={len(points)}"
            for vessel_id, points in trajectories.items()
        )
        raise ValueError(f"all six trajectories must have equal lengths ({detail})")
    return trajectories


def heading_and_speed(points: Sequence[Point], index: int, hz: float) -> tuple[float, float]:
    if hz <= 0 or not math.isfinite(hz):
        raise ValueError("hz must be a finite number greater than zero")
    if not 0 <= index < len(points):
        raise IndexError(index)
    if len(points) == 1:
        return 0.0, 0.0

    if index < len(points) - 1:
        start, end = points[index], points[index + 1]
    else:
        start, end = points[index - 1], points[index]
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    return math.atan2(dy, dx), math.hypot(dx, dy) * hz


def frame_indices(point_count: int, loop: bool) -> Iterator[int]:
    if point_count <= 0:
        raise ValueError("point_count must be greater than zero")
    while True:
        yield from range(point_count)
        if not loop:
            return


def build_datagram(
    trajectories: Mapping[str, Sequence[Point]],
    index: int,
    hz: float,
    stream_id: str,
    seq: int,
    sent_at_ms: int,
) -> bytes:
    if set(trajectories) != set(FLEET_IDS):
        raise ValueError("trajectories must contain exactly USV-1 through USV-6")

    frame: dict[str, dict[str, float | bool]] = {}
    for vessel_id in FLEET_IDS:
        points = trajectories[vessel_id]
        x, y = points[index]
        heading, speed = heading_and_speed(points, index, hz)
        frame[vessel_id] = {
            "x": x,
            "y": y,
            "z": 0.0,
            "heading": heading,
            "speed": speed,
            "isFault": False,
            "health": 100.0,
        }

    payload = {
        "version": 1,
        "type": "fleet",
        "streamId": stream_id,
        "seq": seq,
        "sentAtMs": sent_at_ms,
        "frame": frame,
    }
    encoded = json.dumps(
        payload,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
    ).encode("utf-8")
    if len(encoded) > MAX_DATAGRAM_BYTES:
        raise ValueError(
            f"encoded datagram is {len(encoded)} bytes; limit is {MAX_DATAGRAM_BYTES}"
        )
    return encoded


def send_trajectory(
    host: str,
    port: int,
    hz: float,
    should_loop: bool,
    trajectory_dir: Path,
) -> int:
    trajectories = load_trajectories(trajectory_dir)
    point_count = len(next(iter(trajectories.values())))
    stream_id = str(uuid.uuid4())
    period = 1.0 / hz
    deadline = time.monotonic()
    seq = 0

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sender:
        for index in frame_indices(point_count, should_loop):
            packet = build_datagram(
                trajectories=trajectories,
                index=index,
                hz=hz,
                stream_id=stream_id,
                seq=seq,
                sent_at_ms=time.time_ns() // 1_000_000,
            )
            sender.sendto(packet, (host, port))
            seq += 1
            deadline += period
            remaining = deadline - time.monotonic()
            if remaining > 0:
                time.sleep(remaining)
            elif remaining < -period:
                deadline = time.monotonic()
    return seq


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Send the six CETUS CSV trajectories as complete UDP fleet frames."
    )
    parser.add_argument("--host", required=True, help="IPv4 address of the CETUS EXE computer")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--hz", type=float, default=DEFAULT_HZ)
    parser.add_argument("--loop", action="store_true", help="repeat after the final CSV row")
    parser.add_argument(
        "--trajectory-dir",
        type=Path,
        default=DEFAULT_TRAJECTORY_DIR,
        help="directory containing the six mapped CSV files",
    )
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    if args.hz <= 0 or not math.isfinite(args.hz):
        parser.error("--hz must be a finite number greater than zero")
    return args


def main() -> int:
    args = parse_args()
    try:
        frames = send_trajectory(
            host=args.host,
            port=args.port,
            hz=args.hz,
            should_loop=args.loop,
            trajectory_dir=args.trajectory_dir,
        )
    except KeyboardInterrupt:
        print("Stopped by user.")
        return 130
    except (OSError, ValueError) as error:
        print(f"Error: {error}")
        return 1
    print(f"Sent {frames} complete fleet frames to {args.host}:{args.port}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
