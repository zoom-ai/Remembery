import os
import sys
import io
from PIL import Image

# Add backend directory to sys.path so we can import app modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.utils.exif import extract_image_exif

from fractions import Fraction

def create_mock_image_with_exif():
    # Create a 100x100 red square image
    img = Image.new('RGB', (100, 100), color = 'red')
    
    # Get standard EXIF block from Image
    exif = img.getexif()
    
    # Make: tag 271 (0x010f)
    exif[271] = "Apple"
    # Model: tag 272 (0x0110)
    exif[272] = "iPhone 13 Pro"
    
    # Exif IFD: tag 34665 (0x8769)
    # DateTimeOriginal: tag 36867 (0x9003)
    exif_ifd = exif.get_ifd(34665)
    exif_ifd[36867] = "2023:10:12 14:30:15"
    
    # GPS Info IFD: tag 34853 (0x8825)
    # 1: GPSLatitudeRef, 2: GPSLatitude, 3: GPSLongitudeRef, 4: GPSLongitude
    gps_ifd = exif.get_ifd(34853)
    gps_ifd[1] = "N"
    gps_ifd[2] = (Fraction(37, 1), Fraction(30, 1), Fraction(30, 1)) # 37 deg 30 min 30 sec -> 37.508333...
    gps_ifd[3] = "E"
    gps_ifd[4] = (Fraction(126, 1), Fraction(58, 1), Fraction(20, 1)) # 126 deg 58 min 20 sec -> 126.972222...
    
    # Save the image with exif
    filename = "mock_exif_test.jpg"
    img.save(filename, format='JPEG', exif=exif)
    return filename

def main():
    print("--- Testing EXIF Extraction Logic ---")
    filename = create_mock_image_with_exif()
    print(f"Created temporary mock image: {filename}")
    
    try:
        exif_data = extract_image_exif(filename)
        print("Extracted EXIF Data:")
        print(exif_data)
        
        # Verify fields
        assert exif_data.get("Make") == "Apple", f"Expected Make to be 'Apple', got {exif_data.get('Make')}"
        assert exif_data.get("Model") == "iPhone 13 Pro", f"Expected Model to be 'iPhone 13 Pro', got {exif_data.get('Model')}"
        assert exif_data.get("DateTimeOriginal") == "2023:10:12 14:30:15", f"Expected DateTimeOriginal to be '2023:10:12 14:30:15', got {exif_data.get('DateTimeOriginal')}"
        
        # Approximate coordinate check
        lat = exif_data.get("GPSLatitude")
        lon = exif_data.get("GPSLongitude")
        assert lat is not None and abs(lat - 37.508333) < 0.001, f"Expected Latitude around 37.508333, got {lat}"
        assert lon is not None and abs(lon - 126.972222) < 0.001, f"Expected Longitude around 126.972222, got {lon}"
        
        print("\nSUCCESS: All EXIF parsing assertions passed!")
    except Exception as e:
        print(f"\nFAILURE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if os.path.exists(filename):
            os.remove(filename)
            print(f"Removed temporary mock image: {filename}")

if __name__ == "__main__":
    main()
