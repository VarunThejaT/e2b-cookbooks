import asyncio
from e2b_code_interpreter import Sandbox, AsyncSandbox

# Your template ID from the previous step
template_id = 'id-of-your-template'  # $HighlightLine

async def main():
    sandbox = await AsyncSandbox.create(template_id)  # $HighlightLine 
    execution = await sandbox.run_code("""
    import cowsay
    cowsay.cow('Hello from E2B!')
    """)
    print(execution.logs)

asyncio.run(main())