# Evidence

## Test evidence

````markdown
**Before:** `skips the write when content is unchanged` fails

```text
expected writeFile to be called 1 time, received 2
```

**After:** the same test passes

```text
✓ skips the write when content is unchanged (3 ms)
```
````

## Screenshots and video

`gh pr create --attach` uploads an image or video to GitHub and puts it in the body. No separate hosting, no committing images to the repo.

- **Only on create.** `gh pr edit` has no `--attach`, so capture every screenshot before step 6.
- Up to 50 files per command. Images and video both work. Video renders as a player and has no alt text.
- Alt text follows the path after `#`: `--attach './login.png#The login error state'`. Without it the filename is used.
- Save files outside the repo, such as `$TMPDIR/pr-evidence/`, so they are never committed.

Check the installed `gh` supports it: `gh pr create --help | grep -- --attach`. If it doesn't, write the Evidence section with a placeholder line and tell the user to drag the images into the PR by hand.

### Append

Attach without referencing the file in the body and `gh` appends the uploads to the end of the body.

```bash
gh pr create --title "Fix login error state" --body "$BODY" \
  --attach './after.png#Login showing the error message'
```

### Place inline

Reference the file in the body with a relative path and `gh` rewrites it to the uploaded asset in place. Use this to put each image under the After label in the Evidence section.

```bash
BODY='## Evidence

**Before:** login failed with no message.

**After:**

![Login showing the error message](./after.png)'

gh pr create --title "Fix login error state" --body "$BODY" \
  --attach ./after.png
```

Alt text written in the body wins over alt text after `#`, so give it in one place.

### Partial failure

If some uploads fail, the PR is still created with the ones that worked. The command exits non-zero but still prints the PR URL. Capture the URL, do not retry `gh pr create` (it would fail on the existing PR), and tell the user which files are missing.
