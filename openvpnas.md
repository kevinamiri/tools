Check the LicUsage and restart:

```bash
#!/bin/bash

# Function to execute shell command and return it
execShellCommand() {
    cmd=$1
    readarray -t result < <(sudo $cmd 2>&1)
    echo ${result[2]}
}

# Function to get the number of licensed concurrent connections
getLicensedConnections() {
    result=$(execShellCommand "/usr/local/openvpn_as/scripts/sacli LicUsage")
    echo "licensed connections: ${result}"
    if (( result < 100 )); then
        sudo systemctl daemon-reload && sudo systemctl restart openvpnas.service
    fi
}

getLicensedConnections
```

Make the script executable:

```bash
chmod +x /root/openvpn_status.bash
```

Add cron job to run the script every five minutes, the script should be run as root and have access to the openvpn_as command:

```bash
*/5 * * * * /usr/bin/bash /root/openvpn_status.bash
```

To change the `Restart` parameter to `always` in the service file:

```bash
sudo sed -i 's/^Restart=.*$/Restart=always/' /lib/systemd/system/openvpnas.service && sudo systemctl daemon-reload && sudo systemctl restart openvpnas.service
```
