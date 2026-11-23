/*! Third-party component: lz-string 1.5.0
MIT License

Copyright (c) 2013 pieroxy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import LZString from "lz-string";

const prefix = "IAF-LZ16/1:";

function checksum(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function encodeSave(game) {
  const json = JSON.stringify(game);
  if (typeof json !== "string") throw new TypeError("A campaign save must contain a value.");
  return `${prefix}${json.length}:${checksum(json)}:${LZString.compressToUTF16(json)}`;
}

export function decodeSave(data) {
  if (data == null) return null;
  if (!data.startsWith("IAF-LZ16/")) return JSON.parse(data);
  const match = /^IAF-LZ16\/1:(\d+):([0-9a-f]{8}):([\s\S]*)$/.exec(data);
  if (!match) throw new SyntaxError("This saved campaign uses an unreadable format.");
  const json = LZString.decompressFromUTF16(match[3]);
  if (typeof json !== "string" || json.length !== Number(match[1]) || checksum(json) !== match[2]) {
    throw new SyntaxError("The saved campaign is incomplete or damaged.");
  }
  return JSON.parse(json);
}

export const compressedSave = (data) => typeof data === "string" && data.startsWith(prefix);
