output "server_ip" {
  description = "Public IPv4 address of the server"
  value       = hcloud_server.main.ipv4_address
}

output "server_ipv6" {
  description = "Public IPv6 address of the server"
  value       = hcloud_server.main.ipv6_address
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh deploy@${hcloud_server.main.ipv4_address}"
}

output "server_status" {
  description = "Current server status"
  value       = hcloud_server.main.status
}
