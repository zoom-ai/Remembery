import os
import sys
import io
from fractions import Fraction
from PIL import Image

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from fastapi import UploadFile, BackgroundTasks
from app.routers.archive import upload_archive_item
from app.database import SessionLocal
from app import models

def create_mock_image_bytes():
    img = Image.new('RGB', (100, 100), color = 'blue')
    exif = img.getexif()
    exif[271] = "Samsung"
    exif[272] = "Galaxy S21"
    
    exif_ifd = exif.get_ifd(34665)
    exif_ifd[36867] = "2024:05:19 12:00:00"
    
    gps_ifd = exif.get_ifd(34853)
    gps_ifd[1] = "S"  # South
    gps_ifd[2] = (Fraction(33, 1), Fraction(51, 1), Fraction(0, 1)) # -33.85
    gps_ifd[3] = "W"  # West
    gps_ifd[4] = (Fraction(151, 1), Fraction(12, 1), Fraction(0, 1)) # -151.2
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', exif=exif)
    buf.seek(0)
    return buf

def test_upload():
    img_buf = create_mock_image_bytes()
    from starlette.datastructures import Headers
    headers = Headers({"content-type": "image/jpeg"})
    upload_file = UploadFile(file=img_buf, filename="mock_upload_test.jpg", headers=headers)
    
    db = SessionLocal()
    try:
        # Prepare owner/user
        user = db.query(models.User).first()
        if not user:
            user = models.User(
                username="testexifuser",
                email="testexif@example.com",
                hashed_password="hashed_password",
                full_name="EXIF Tester"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        owner_id = user.id
        
        # Test Case 1: Without custom_attributes (auto-extract)
        bg_tasks = BackgroundTasks()
        print(f"Calling upload_archive_item directly without custom_attributes (owner_id={owner_id})...")
        
        response = upload_archive_item(
            background_tasks=bg_tasks,
            owner_id=owner_id,
            title="EXIF Auto Test Image",
            description="Testing upload direct call auto EXIF",
            category_id=None,
            item_type=None,
            tags="test,exif",
            metadata_json=None,
            custom_attributes=None,  # Not provided, should trigger auto-extraction!
            source=None,
            auto_index=False,
            file=upload_file,
            db=db
        )
        
        item = response.item
        custom_attributes = item.custom_attributes
        print("Response Custom Attributes (Auto):", custom_attributes)
        
        assert custom_attributes is not None, "custom_attributes should not be None"
        assert custom_attributes.get("Make") == "Samsung"
        assert custom_attributes.get("Model") == "Galaxy S21"
        assert custom_attributes.get("DateTimeOriginal") == "2024:05:19 12:00:00"
        assert abs(custom_attributes.get("GPSLatitude") - (-33.85)) < 0.001
        assert abs(custom_attributes.get("GPSLongitude") - (-151.2)) < 0.001
        
        # Clean up database entry
        db_item = db.query(models.ArchiveItem).filter(models.ArchiveItem.id == item.id).first()
        if db_item:
            if db_item.file_url:
                local_path = db_item.file_url.lstrip('/')
                if os.path.exists(local_path):
                    os.remove(local_path)
            db.delete(db_item)
            db.commit()
            print("Cleaned up Auto Test database entry and file.")

        # Test Case 2: With manual custom_attributes (should NOT extract EXIF)
        img_buf2 = create_mock_image_bytes()
        upload_file2 = UploadFile(file=img_buf2, filename="mock_upload_test2.jpg", headers=headers)
        
        manual_attrs = '{"location": "Seoul", "custom_notes": "Sunny day"}'
        print(f"Calling upload_archive_item directly WITH manual custom_attributes (owner_id={owner_id})...")
        
        response2 = upload_archive_item(
            background_tasks=bg_tasks,
            owner_id=owner_id,
            title="EXIF Manual Test Image",
            description="Testing upload direct call manual attributes",
            category_id=None,
            item_type=None,
            tags="test,exif",
            metadata_json=None,
            custom_attributes=manual_attrs,  # Provided!
            source=None,
            auto_index=False,
            file=upload_file2,
            db=db
        )
        
        item2 = response2.item
        custom_attributes2 = item2.custom_attributes
        print("Response Custom Attributes (Manual):", custom_attributes2)
        
        assert custom_attributes2 is not None
        assert custom_attributes2.get("location") == "Seoul"
        assert custom_attributes2.get("custom_notes") == "Sunny day"
        assert "Make" not in custom_attributes2, "Make should not be extracted since custom_attributes was provided"
        assert "Model" not in custom_attributes2, "Model should not be extracted"
        
        # Clean up database entry
        db_item2 = db.query(models.ArchiveItem).filter(models.ArchiveItem.id == item2.id).first()
        if db_item2:
            if db_item2.file_url:
                local_path2 = db_item2.file_url.lstrip('/')
                if os.path.exists(local_path2):
                    os.remove(local_path2)
            db.delete(db_item2)
            db.commit()
            print("Cleaned up Manual Test database entry and file.")
            
        print("\nSUCCESS: All Router Direct Call EXIF Extraction & Exclusion verification tests passed!")
        
    except Exception as e:
        print(f"\nFAILURE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    test_upload()
