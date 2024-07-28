# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt requirements.txt

# Show the contents of requirements.txt
RUN cat requirements.txt

# Install dependencies with verbose output
RUN pip install --no-cache-dir --verbose -r requirements.txt

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code into the container
COPY . .

# Command to run the application
# CMD ["python", "app.py"]
CMD ["flask", "run"]
