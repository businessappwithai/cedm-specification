/**
 * `child_process` for the browser build. Generation with `skipCliScaffold`
 * never starts a process — the `loco new` scaffold and the post-generation
 * setup are the only callers — so any call here is a defect in the build, and
 * says so rather than pretending to succeed.
 */
function refuse(name: string): never {
  throw new Error(`child_process.${name} is not available in the browser build`);
}
export const execSync = (): never => refuse("execSync");
export const spawn = (): never => refuse("spawn");
export const spawnSync = (): never => refuse("spawnSync");
export const exec = (): never => refuse("exec");
export default { execSync, spawn, spawnSync, exec };
