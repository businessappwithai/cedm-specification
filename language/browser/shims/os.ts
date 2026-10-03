/** `node:os` for the browser build: the staging directory lives in the in-memory volume. */
export const tmpdir = (): string => "/tmp";
export const homedir = (): string => "/home";
export const platform = (): string => "browser";
export const EOL = "\n";
export default { tmpdir, homedir, platform, EOL };
