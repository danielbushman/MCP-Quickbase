FROM node:18

# Install Python, pip, and other required tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-full \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && ln -sf /usr/bin/pip3 /usr/bin/pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy files needed for setup
COPY package*.json ./
COPY requirements.txt ./

# Install dependencies directly (no virtual environment)
RUN pip install --break-system-packages -r requirements.txt
RUN npm install

# Copy the rest of the application
COPY . .

# Make scripts executable
RUN chmod +x src/quickbase/server.js
RUN if [ -f run_tests.sh ]; then chmod +x run_tests.sh; fi
RUN if [ -f test_file_operations.py ]; then chmod +x test_file_operations.py; fi
RUN if [ -f test_pagination.py ]; then chmod +x test_pagination.py; fi
RUN if [ -f test_remaining_operations.py ]; then chmod +x test_remaining_operations.py; fi

# Create debug script with more detailed checks
RUN echo '#!/bin/bash\necho "Active Python: $(which python)"\necho "Python version: $(python --version)"\necho "Working directory: $(pwd)"\nls -la\necho "Python packages:"\npip list' > debug.sh
RUN chmod +x debug.sh

# Run the server
CMD ["node", "src/quickbase/server.js"]