ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.20
FROM ${BUILD_FROM}

RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY app.py /app/app.py
COPY run.sh /run.sh

RUN pip3 install --no-cache-dir --break-system-packages flask requests \
    && chmod +x /run.sh

CMD [ "/run.sh" ]
