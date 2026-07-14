import pdfplumber
from PIL import Image
import pytesseract
from io import BytesIO


def extract_text_from_pdf(page) -> str:
    text = page.extract_text(layout=True)
    return text.split() if text else ""


def perform_ocr_on_page(page) -> str:

    page_image = page.to_image(resolution=300)

    img_buffer = BytesIO()
    page_image.save(img_buffer, format="PNG")
    img_buffer.seek(0)

    pil_img = Image.open(img_buffer)

    ocr_text = pytesseract.image_to_string(pil_img)
    return ocr_text.strip()


def process_document(file_bytes: bytes) -> tuple[str, list[dict]]:
    full_text_accumulator = []
    page_metadata_log = []

    with pdfplumber.open(BytesIO(file_bytes)) as pdf:

        for page_num, page in enumerate(pdf.pages, start=1):
            extraction_method = "layout_parser"

            page_text = extract_text_from_pdf(page)

            if isinstance(page_text, list):
                clean_string_text = " ".join(page_text)
            else:
                clean_string_text = str(page_text)

            if not clean_string_text:
                extraction_method = "ocr_tesseract"
                clean_string_text = perform_ocr_on_page(page)

            full_text_accumulator.append(clean_string_text)

            page_metadata_log.append(
                {
                    "page_number": page_num,
                    "extraction_method": extraction_method,
                    "character_count": len(clean_string_text),
                }
            )
        # import pdb

        # pdb.set_trace()
        final_raw_document_string = "\n\n--- PAGE BREAK ---\n\n".join(
            full_text_accumulator
        )

        return final_raw_document_string, page_metadata_log
