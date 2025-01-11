import { FragmentSchema } from '@/lib/e2b/schema';
import {
  ExecutionResult,
  ExecutionResultInterpreter,
  ExecutionResultWeb,
} from '@/lib/e2b/types';
import { Sandbox } from '@e2b/code-interpreter';
import { ChatOpenAI } from '@langchain/openai';

const sandboxTimeout = 10 * 60 * 1000; // 10 minute in ms

export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    fragment,
    result,
    userID,
    apiKey,
  }: {
    fragment: FragmentSchema;
    userID: string;
    apiKey?: string;
    result: ExecutionResultInterpreter;
  } = await req.json();
  console.log('fragment', fragment);
  console.log('userID', userID);
  // console.log('apiKey', apiKey)

  // Create/Connect a interpreter or a sandbox
  const sbx = !result?.runtimeError
    ? await Sandbox.create('code-interpreter-v1', {
        metadata: { template: 'code-interpreter-v1', userID: userID },
        timeoutMs: sandboxTimeout,
        apiKey,
      })
    : await Sandbox.connect(result.sbxId);

  // Install packages
  if (fragment.has_additional_dependencies) {
    await sbx.commands.run(fragment.install_dependencies_command, {
      onStdout(data) {
        console.log(data);
      },
      onStderr(data) {
        console.log(data);
      },
    });
    console.log(
      Installed dependencies: ${fragment.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxId}
    );
  }

  // Copy code to fs
  if (fragment.code && Array.isArray(fragment.code)) {
    fragment.code.forEach(async (file) => {
      await sbx.files.write(file.file_path, file.file_content);
      console.log(Copied file to ${file.file_path} in ${sbx.sandboxId});
    });
  } else {
    await sbx.files.write(fragment.file_path, fragment.code);
    console.log(Copied file to ${fragment.file_path} in ${sbx.sandboxId});
  }
  if (result) {
    const llm = new ChatOpenAI({ model: 'o1-mini' });
    const response = await llm.invoke(
      Correct the code:\n${correctedCode}\nError:\n Name: ${result?.runtimeError?.name},\n Traceback: ${result?.runtimeError?.traceback},\n Value: ${result?.runtimeError?.value},\n STDOUT: ${result?.stdout},\n STDERR: ${result?.stderr},\n NOTE: RETURN THE CORRECTED CODE ONLY
    );
    correctedCode = response.content
      .toString()
      .replace('python', '')
      .replace('', '');
  }

  let { logs, error, results } = await sbx.runCode(correctedCode);
  return new Response(
    JSON.stringify({
      sbxId: sbx?.sandboxId,
      template: 'code-interpreter-v1',
      stdout: logs.stdout,
      stderr: logs.stderr,
      runtimeError: error,
      cellResults: results,
    } as ExecutionResultInterpreter)
  );
}