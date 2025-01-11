from dotenv import load_dotenv
load_dotenv()
from e2b_code_interpreter import Sandbox

sbx = Sandbox() # By default the sandbox is alive for 5 minutes
for i in range(100):
    execution = sbx.run_code("print('hello world')") # Execute Python inside the sandbox
    print(i)
    print(execution.logs)

files = sbx.files.list("/")
print(files)
