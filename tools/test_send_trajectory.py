import itertools
import json
import math
import tempfile
import unittest
from pathlib import Path

from tools import send_trajectory as sender


class TrajectorySenderTests(unittest.TestCase):
    def write_fleet(self, directory: Path, lengths: dict[str, int] | None = None) -> None:
        lengths = lengths or {vessel_id: 3 for vessel_id in sender.FLEET_IDS}
        for vessel_id, filename in sender.TRAJECTORY_FILES.items():
            rows = ["x,y"]
            for index in range(lengths[vessel_id]):
                rows.append(f"{index},{index * 2}")
            (directory / filename).write_text("\n".join(rows), encoding="utf-8")

    def test_csv_mapping_loads_all_six_vessels(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            self.write_fleet(directory)
            trajectories = sender.load_trajectories(directory)
        self.assertEqual(tuple(trajectories), sender.FLEET_IDS)
        self.assertEqual(trajectories["USV-1"][2], (2.0, 4.0))

    def test_unequal_csv_lengths_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            lengths = {vessel_id: 3 for vessel_id in sender.FLEET_IDS}
            lengths["USV-6"] = 2
            self.write_fleet(directory, lengths)
            with self.assertRaisesRegex(ValueError, "equal lengths"):
                sender.load_trajectories(directory)

    def test_heading_and_speed_use_sample_frequency(self) -> None:
        heading, speed = sender.heading_and_speed([(0.0, 0.0), (3.0, 4.0)], 0, 2.0)
        self.assertAlmostEqual(heading, math.atan2(4.0, 3.0))
        self.assertAlmostEqual(speed, 10.0)

    def test_heading_skips_duplicate_points_toward_next_move(self) -> None:
        points = [(0.0, 0.0), (0.0, 0.0), (0.0, 0.0), (3.0, 4.0)]
        heading, speed = sender.heading_and_speed(points, 1, 1.0)
        self.assertAlmostEqual(heading, math.atan2(4.0, 3.0))
        self.assertAlmostEqual(speed, 0.0)

    def test_single_and_loop_playback_indices(self) -> None:
        self.assertEqual(list(sender.frame_indices(3, False)), [0, 1, 2])
        looped = list(itertools.islice(sender.frame_indices(3, True), 8))
        self.assertEqual(looped, [0, 1, 2, 0, 1, 2, 0, 1])

    def test_json_is_complete_and_below_frame_limit(self) -> None:
        trajectories = {
            vessel_id: [(1.25, 2.5), (2.25, 3.5)]
            for vessel_id in sender.FLEET_IDS
        }
        encoded = sender.build_frame(
            trajectories,
            index=0,
            hz=20,
            stream_id="test-stream",
            seq=7,
            sent_at_ms=123,
        )
        payload = json.loads(encoded)
        self.assertLessEqual(len(encoded.encode("utf-8")), sender.MAX_FRAME_BYTES)
        self.assertEqual(payload["version"], 1)
        self.assertEqual(payload["type"], "fleet")
        self.assertEqual(payload["seq"], 7)
        self.assertEqual(set(payload["frame"]), set(sender.FLEET_IDS))
        self.assertEqual(
            set(payload["frame"]["USV-1"]),
            {"x", "y", "z", "heading", "speed", "isFault", "health"},
        )


if __name__ == "__main__":
    unittest.main()
