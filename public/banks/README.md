# Bank Logos

Place your bank logo images (JPEG, PNG, SVG) in this folder.

## Usage

Once you upload an image here (e.g., `banco-popular.jpg`), you can reference it in your code like this:

```tsx
<Image src="/images/banks/banco-popular.jpg" alt="Banco Popular" width={50} height={50} />
```

Or in the `banks` array configuration:

```ts
{
  bankName: "Banco Popular",
  logo: "/images/banks/banco-popular.jpg",
  // ...
}
```
