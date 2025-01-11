import asyncio
from e2b_code_interpreter import Sandbox, AsyncSandbox

# Your template ID from the previous step
template_id = '4p2d1lq91ujz31jwd355'

async def main():
    sandbox = await AsyncSandbox.create(template_id)  
    execution = await sandbox.run_code("""
    import cowsay
    cowsay.cow('Hello from E2B!')
    """)
    print(execution.logs.stdout)

asyncio.run(main())