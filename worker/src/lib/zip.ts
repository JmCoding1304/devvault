import { Zip, ZipPassThrough } from 'fflate';

// Stream files from R2 into a zip archive, writing to the provided WritableStream.
// Files are added uncompressed (passthrough) to avoid memory/CPU pressure on Workers.
export async function zipFolder(
  bucket: R2Bucket,
  files: { key: string; size: number }[],
  prefix: string,
  writable: WritableStream<Uint8Array>
): Promise<void> {
  const writer = writable.getWriter();

  return new Promise<void>((resolve, reject) => {
    const zip = new Zip((err, chunk, final) => {
      if (err) {
        writer.abort(err);
        reject(err);
        return;
      }
      writer.write(chunk).then(() => {
        if (final) {
          writer.close().then(resolve).catch(reject);
        }
      }).catch(reject);
    });

    (async () => {
      for (const file of files) {
        // Strip the prefix so paths inside zip are relative
        const relativePath = file.key.startsWith(prefix)
          ? file.key.slice(prefix.length)
          : file.key;

        if (!relativePath) continue;

        const obj = await bucket.get(file.key);
        if (!obj) continue;

        const entry = new ZipPassThrough(relativePath);
        zip.add(entry);

        const reader = obj.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            entry.push(new Uint8Array(0), true);
            break;
          }
          entry.push(value);
        }
      }

      zip.end();
    })().catch(reject);
  });
}
