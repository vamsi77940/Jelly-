import cv2
import os

video_path = r"c:\Users\Saimanideep\OneDrive\Desktop\life-assist-phase6-voice_1\life-assist\WhatsApp Video 2026-07-20 at 6.31.20 PM.mp4"
output_dir = r"c:\Users\Saimanideep\OneDrive\Desktop\life-assist-phase6-voice_1\life-assist\scratch_frames"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("Error: Could not open video.")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps
print(f"FPS: {fps}, Total Frames: {total_frames}, Duration: {duration}s")

# Extract a frame every 1 second
interval_frames = int(fps) if fps > 0 else 30
frame_count = 0
saved_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    if frame_count % interval_frames == 0:
        output_path = os.path.join(output_dir, f"frame_{saved_count:03d}.png")
        cv2.imwrite(output_path, frame)
        print(f"Saved {output_path}")
        saved_count += 1
        
    frame_count += 1

cap.release()
print("Done extracting frames!")
