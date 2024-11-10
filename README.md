# pngcrypt

Use [steganography](https://en.wikipedia.org/wiki/Steganography) to encrypt a file's contents (e.g - `file.zip`) into a PNG image and use an existing PNG (e.g. - `mask.png`) to make the encrypted image appear normal.

## Compile

```sh
# Create self-contained executables (`pngencrypt`, `pngdecrypt`)
# for all supported targets in the `build/` directory.
deno task compile
```

## Generate a Secret

```sh
# AES (Advanced Encryption Standard) supports key lengths of exactly 128 bits, 192 bits, or 256 bits.
openssl rand -hex 32 # 256-bits of entropy
openssl rand -hex 24 # 192-bits of entropy
openssl rand -hex 32 # 128-bits of entropy
```

## Generate a Mask

The mask image must be a valid PNG file and at least as big as the size of the file contents you wish to encrypt within it.

**Tip**: Using `Preview` on a Mac, artifically inflate the size of an existing image by using the `Tools > Adjust Size...`

1. scale the image by some factor
2. approximate "Resulting Size" to before pressing "OK"
3. save the inflated mask image as a PNG

## Encrypting & Decrypting

### Encrypt

```sh
echo ${secret} | pngencrypt file.zip mask.png encrypted.png
```

### Decrypt

```sh
echo ${secret} | pngdecrypt encrypted.png file.zip
```

### Keep Your Secret Safe!!!

Avoid exposing the secret to maintain its integrity!

Instead of using `openssl` directly, use a service like Doppler to generate a valid hex secret on a trusted host.

```sh
doppler secrets get SECRET --plain | pngencrypt ...
doppler secrets get SECRET --plain | pngdecrypt ...
```

Once you have transferred the image and decrypted with `pngdecrypt`, you can delete all traces of the encrypted image and secret store.

#### Why is this more secure?

- No Disk Storage:

  - never written to any file or temporary storage on disk
  - exists only in memory during command execution

- Avoids Environment Variables:

  - Environment variables can sometimes be exposed via process monitoring tools like ps or could be inherited by child processes. By not using them, you eliminate this risk.

- No Command-Line Exposure:

  - not included in the command line
  - prevents appearance in shell history or process listings

- In-Memory Transfer:

  - transferred directly between processes in memory
  - minimizes attack surface where secret could be intercepted

- Process Isolation:
  - pipes the secret directly
  - avoids using process substitution which might touch the disk
