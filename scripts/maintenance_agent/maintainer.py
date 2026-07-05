import os
import asyncio
import argparse
from dotenv import load_dotenv

# Import Google Antigravity SDK
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
from google.antigravity.hooks import policy

# Load environment variables (GEMINI_API_KEY)
load_dotenv()

SYSTEM_INSTRUCTIONS = """
You are a Senior TypeScript/React Engineer serving as an autonomous codebase maintainer.
Your primary directive is to keep the management-os application up to date and error-free.

When you are run, follow these steps autonomously:
1. Run `npm outdated` to check for outdated dependencies.
2. Run `npm update` to safely update minor/patch versions, or update specific packages if requested.
3. Run `npx tsc --noEmit` to check for any TypeScript compilation errors.
4. If there are compilation errors, you MUST read the failing files, implement a fix, and run `tsc` again until passing.
5. If there are no errors, print a summary report of your findings and exit.

You have full autonomy over the terminal and filesystem. 
Use the `run_command` tool to execute shell scripts.
Use `edit_file` to fix any bugs you encounter.
"""

async def run_maintainer(dry_run: bool = False):
    print("Starting Autonomous Maintenance Agent...")
    print("Initializing Google Antigravity SDK...")
    
    # Configure safety policies
    # allow_all() is required to allow the agent to autonomously run commands like `npm update` and `tsc`
    policies = [policy.allow_all()]
    
    # In a dry_run, we might want to restrict commands
    if dry_run:
        print("Dry run mode enabled: The agent will ask for permission before running commands.")
        policies = [policy.confirm_run_command()]

    config = LocalAgentConfig(
        system_instructions=SYSTEM_INSTRUCTIONS,
        capabilities=CapabilitiesConfig(), # Enables built-in write tools (run_command, edit_file)
        policies=policies,
    )
    
    agent = Agent(config)
    
    initial_prompt = "Hello maintainer. Please begin your routine system check and update."
    print(f"\n[System] {initial_prompt}")
    
    # Start the agent execution
    try:
        response = await agent.run(initial_prompt)
        print(f"\n[Maintainer Agent]: {response}")
    except Exception as e:
        print(f"\n[Error] Maintainer Agent crashed: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Autonomous Codebase Maintainer Agent")
    parser.add_argument("--dry-run", action="store_true", help="Run the agent in dry-run mode where it will ask before executing shell commands.")
    args = parser.parse_args()
    
    # Require GEMINI_API_KEY
    if not os.environ.get("GEMINI_API_KEY"):
        print("Error: GEMINI_API_KEY environment variable is missing.")
        print("Please set it in a .env file or export it in your shell.")
        print("You can get an API key from: https://aistudio.google.com/app/api-keys")
        exit(1)
        
    asyncio.run(run_maintainer(args.dry_run))
