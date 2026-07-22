FROM python:3.11-slim

WORKDIR /app

# libgl1/libglib2.0-0 are required by opencv-python; git-lfs is only needed if the
# build image ever does its own `git clone` (Render's own checkout step normally
# handles LFS resolution before invoking this Dockerfile).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY models/requirements.txt ./models/requirements.txt
RUN pip install --no-cache-dir -r models/requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
