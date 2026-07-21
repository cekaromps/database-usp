#!/bin/bash
# Create a connection to use the database remotely
ssh -L 5433:localhost:5432 ups@ssh.utamapasogit.com
