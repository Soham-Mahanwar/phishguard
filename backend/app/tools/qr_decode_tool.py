"""Decode a QR code image using OpenCV's built-in QRCodeDetector.

Deliberately using cv2 instead of pyzbar: pyzbar depends on the system
libzbar shared library, which is a common install headache on Windows.
cv2's QRCodeDetector ships fully self-contained inside opencv-python wheels.
"""
import numpy as np
import cv2


def decode_qr_image(image_bytes: bytes) -> dict:
    """Returns {"decoded_text": str | None, "error": str | None}"""
    result = {"decoded_text": None, "error": None}
    try:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            result["error"] = "could not decode image file"
            return result

        detector = cv2.QRCodeDetector()
        data, points, _ = detector.detectAndDecode(img)
        if data:
            result["decoded_text"] = data
        else:
            result["error"] = "no QR code found in image"
    except Exception as e:  # noqa: BLE001 - tool must never crash the pipeline
        result["error"] = f"qr decode failed: {e}"
    return result
