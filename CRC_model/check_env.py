"""
Helper script to check if .env file is properly configured.
Run this to verify your OpenAI API key is being loaded correctly.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / '.env'
print(f"Looking for .env file at: {env_path}")
print(f".env file exists: {env_path.exists()}")

if env_path.exists():
    print(f"\n.env file contents:")
    with open(env_path, 'r') as f:
        content = f.read()
        # Mask the API key for security
        if 'OPENAI_API_KEY' in content:
            lines = content.split('\n')
            for line in lines:
                if 'OPENAI_API_KEY' in line:
                    if '=' in line:
                        key, value = line.split('=', 1)
                        masked_value = value[:8] + '...' + value[-4:] if len(value) > 12 else '***'
                        print(f"  {key}={masked_value}")
                    else:
                        print(f"  {line}")
                else:
                    print(f"  {line}")
else:
    print("\nERROR: .env file not found!")
    print(f"   Please create a .env file at: {env_path}")
    print("   With the following content:")
    print("   OPENAI_API_KEY=your_api_key_here")

# Try loading
load_dotenv(dotenv_path=env_path)
load_dotenv()

# Check if API key is loaded
api_key = os.getenv('OPENAI_API_KEY') or os.environ.get('OPENAI_API_KEY')
if api_key:
    print(f"\nSUCCESS: OPENAI_API_KEY found in environment!")
    print(f"   Key length: {len(api_key)} characters")
    print(f"   Key starts with: {api_key[:8]}...")
else:
    print("\nERROR: OPENAI_API_KEY not found in environment variables")
    print("   Make sure your .env file contains: OPENAI_API_KEY=your_key_here")

