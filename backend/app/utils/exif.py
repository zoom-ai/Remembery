import os
from typing import Dict, Any, Optional
from PIL import Image

def convert_to_decimal_degrees(gps_coords, ref) -> Optional[float]:
    """
    Convert GPS coordinates (degrees, minutes, seconds) to decimal degrees.
    gps_coords is expected to be a list/tuple of 3 elements: degrees, minutes, seconds.
    ref is a string like 'N', 'S', 'E', 'W'.
    """
    if not gps_coords or len(gps_coords) < 3:
        return None
        
    def _to_float(val) -> float:
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, (tuple, list)) and len(val) == 2:
            num, den = val
            if den != 0:
                return float(num) / float(den)
            return float(num)
        try:
            return float(val)
        except Exception:
            return 0.0

    try:
        degrees = _to_float(gps_coords[0])
        minutes = _to_float(gps_coords[1])
        seconds = _to_float(gps_coords[2])
        
        decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
        
        if ref and isinstance(ref, str):
            clean_ref = ref.strip().upper().replace("\x00", "")
            if clean_ref in ("S", "W"):
                decimal = -decimal
                
        return decimal
    except Exception:
        return None

def extract_image_exif(file_path: str) -> Dict[str, Any]:
    """
    Safely extract EXIF metadata from an image file using Pillow.
    Returns a dictionary of core EXIF attributes:
      - DateTimeOriginal: str (or None)
      - Model: str (or None)
      - Make: str (or None)
      - GPSLatitude: float (or None)
      - GPSLongitude: float (or None)
    
    If EXIF parsing fails or file is not a valid image, returns an empty dict {}.
    """
    result = {}
    if not file_path or not os.path.exists(file_path):
        return result

    try:
        with Image.open(file_path) as img:
            # Check if image has exif
            exif_obj = img.getexif()
            if not exif_obj:
                return result

            # Parse primary tags
            # Make: tag 271 (0x010f)
            # Model: tag 272 (0x0110)
            make = exif_obj.get(271)
            model = exif_obj.get(272)

            if make and isinstance(make, str):
                result["Make"] = make.strip().replace("\x00", "")
            if model and isinstance(model, str):
                result["Model"] = model.strip().replace("\x00", "")

            # DateTimeOriginal: tag 36867 (0x9003) inside Exif IFD 34665 (0x8769)
            try:
                exif_ifd = exif_obj.get_ifd(34665)
                if exif_ifd:
                    date_time = exif_ifd.get(36867)
                    if date_time and isinstance(date_time, str):
                        result["DateTimeOriginal"] = date_time.strip().replace("\x00", "")
            except Exception:
                pass

            # GPS info inside GPS IFD 34853 (0x8825)
            # 1: GPSLatitudeRef, 2: GPSLatitude, 3: GPSLongitudeRef, 4: GPSLongitude
            try:
                gps_ifd = exif_obj.get_ifd(34853)
                if gps_ifd:
                    lat_ref = gps_ifd.get(1)
                    lat = gps_ifd.get(2)
                    lon_ref = gps_ifd.get(3)
                    lon = gps_ifd.get(4)

                    if lat and lat_ref:
                        dec_lat = convert_to_decimal_degrees(lat, lat_ref)
                        if dec_lat is not None:
                            result["GPSLatitude"] = dec_lat
                    
                    if lon and lon_ref:
                        dec_lon = convert_to_decimal_degrees(lon, lon_ref)
                        if dec_lon is not None:
                            result["GPSLongitude"] = dec_lon
            except Exception:
                pass

    except Exception as e:
        # Gracefully handle all exceptions to ensure upload never crashes
        print(f"[EXIF ERROR] Failed to parse exif for {file_path}: {e}")
        
    return result
