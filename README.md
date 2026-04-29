# Install everything
make install-all

# Or step by step
make install-shared
make install-bot
make install-api

# Install pre-commit hooks
pre-commit install

# Update all dependencies
make upgrade

# Format code
black .
isort .

# Lint code
ruff check .
mypy .

# Run tests
pytest

# Deploy
