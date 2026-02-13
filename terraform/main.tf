# ---------------------------------------------------------------------------
# SSH Key
# ---------------------------------------------------------------------------
resource "hcloud_ssh_key" "deploy" {
  name       = "${var.server_name}-deploy-key"
  public_key = file(var.ssh_public_key_path)
}

# ---------------------------------------------------------------------------
# Firewall — allow only SSH, HTTP, HTTPS inbound
# ---------------------------------------------------------------------------
resource "hcloud_firewall" "server" {
  name = "${var.server_name}-firewall"

  rule {
    description = "Allow SSH"
    direction   = "in"
    protocol    = "tcp"
    port        = "22"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }

  rule {
    description = "Allow HTTP"
    direction   = "in"
    protocol    = "tcp"
    port        = "80"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }

  rule {
    description = "Allow HTTPS"
    direction   = "in"
    protocol    = "tcp"
    port        = "443"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }
}

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
resource "hcloud_server" "main" {
  name        = var.server_name
  server_type = "cx23"
  image       = "ubuntu-22.04"
  location    = var.location

  ssh_keys     = [hcloud_ssh_key.deploy.id]
  firewall_ids = [hcloud_firewall.server.id]

  user_data = templatefile("${path.module}/cloud-init.yaml", {
    ssh_public_key = trimspace(file(var.ssh_public_key_path))
  })

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  labels = {
    project     = "lifespan"
    environment = "production"
    managed_by  = "terraform"
  }
}
