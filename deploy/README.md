# Deploying Site Survey Tool to Raspberry Pi

This folder contains ready-to-use configs for running the app as a service and (optionally) fronting it with Nginx.

## 1) Prerequisites on the Pi

- Raspberry Pi OS (Bookworm recommended)
- Node.js 20 LTS: install with Nodesource or nvm
- Git, curl, build-essential

## 2) Suggested directory and user

Create a service user and place the app under `/opt` (adjust as needed):

```bash
sudo useradd -m -s /bin/bash sitesurvey || true
sudo usermod -aG dialout sitesurvey   # if using UART GPS
sudo mkdir -p /opt/site_survey_tool
sudo chown -R sitesurvey:sitesurvey /opt/site_survey_tool
```

Copy your repository onto the Pi (scp or git clone), then install and build:

```bash
cd /opt/site_survey_tool
npm install
npm run build
```

Configure `server/config/settings.json` (Modbus, GPS, thresholds, tags).

## 3) systemd service

Edit `deploy/site-survey.service` if needed, then install:

```bash
sudo cp deploy/site-survey.service /etc/systemd/system/site-survey.service
sudo systemctl daemon-reload
sudo systemctl enable site-survey.service
sudo systemctl start site-survey.service
sudo systemctl status site-survey.service
```

Logs:

```bash
journalctl -u site-survey.service -f
```

Key fields to adjust inside the unit:
- `User=sitesurvey` (match your service user)
- `WorkingDirectory=/opt/site_survey_tool` (path to the app)
- `ExecStart=/usr/bin/node server/dist/index.js` (path to Node and entry)
- `SupplementaryGroups=dialout` if using serial GPS and the user needs serial access

## 4) Nginx reverse proxy (optional)

Install Nginx and use the provided config to serve on port 80:

```bash
sudo apt install -y nginx
sudo cp deploy/nginx-site-survey.conf /etc/nginx/sites-available/site-survey
sudo ln -s /etc/nginx/sites-available/site-survey /etc/nginx/sites-enabled/site-survey
sudo nginx -t
sudo systemctl reload nginx
```

Then access the app at `http://<pi-ip>/`.

## 5) Updates

When you update the app:

```bash
cd /opt/site_survey_tool
git pull
npm install
npm run build
sudo systemctl restart site-survey.service
```

## 6) Troubleshooting

- Service won’t start: `systemctl status site-survey.service` and `journalctl -u site-survey.service -n 200`
- Port conflicts: change `PORT` in the systemd unit Environment or free the port
- Serial access denied: ensure the service user is in `dialout` and UART is enabled (`raspi-config`)
- Client assets stale: re-run `npm run build` and restart the service
- Node version: verify `node -v` (prefer 20.x)

## 7) One-command update script (optional)

You can use `deploy/update.sh` to automate the update flow. Copy it to the Pi and make it executable:

```bash
sudo cp deploy/update.sh /usr/local/bin/site-survey-update
sudo chmod +x /usr/local/bin/site-survey-update
```

Run it (defaults to `/opt/site_survey_tool` and service `site-survey.service`):

```bash
site-survey-update
```

You can override the app directory by passing it as the first argument, and the service name via env var:

```bash
SERVICE_NAME=site-survey.service site-survey-update /opt/site_survey_tool
```

What it does:
- `git pull` (falls back to `git fetch` + `reset --hard origin/main` if needed)
- `npm ci` (deterministic install)
- `npm run build`
- `systemctl restart site-survey.service` and prints status