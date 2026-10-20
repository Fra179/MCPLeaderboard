---
title: "How to submit"
draft: false
---

To submit your project, register your GitHub repository, give the grader read access, and configure a webhook so GitHub can notify it when you push changes. Complete all three steps below.

## 1. Register your repository

Open [Submit your project]({{< relref "submit.md" >}}) and fill in the form:

| Field | What to enter |
| --- | --- |
| Assignment | The exercise you are submitting. |
| Repository URL | Your repository's URL, for example `https://github.com/username/repository`. Use your own assignment repository. |
| Student ID | Your matricola. |
| Email | Your university email address ending in `@studenti.uniroma1.it`. |

Click **Submit**. After a successful registration, the page displays a deploy key, a webhook URL, and a webhook secret.

**Save the returned values before leaving or refreshing the page.** The deploy key and webhook secret are shown only once. Keep the secret somewhere safe: you will also need it to retrieve your run artifacts.

Keep the submission page open while you complete the GitHub setup in another tab.

<!-- Screenshot 1: Save as static/images/how-to-submit/registration.png.
Capture the successful submission page, including the success message and the
"Add the deploy key" and "Add the webhook" sections. Use a demo repository and
dummy values; replace the webhook secret with [REDACTED] before sharing.
Once the image is saved, move the following image line outside this comment:
![Successful registration showing the deploy key and webhook settings.](../images/how-to-submit/registration.png)
-->

## 2. Give the grader read access

The deploy key lets the grader read your repository to build and test your solution.

1. On GitHub, open the repository you registered.
2. Go to **Settings → Deploy keys → Add deploy key**.
3. Enter a descriptive title, such as `MCP Grader`.
4. Paste the complete deploy key from the submission page into **Key**.
5. Leave **Allow write access** unchecked. Read access is enough.
6. Click **Add key**.

Add the key to this repository's deploy keys, rather than to your personal account's SSH keys. See [GitHub's deploy key instructions](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) for more details.

<!-- Screenshot 2: Save as static/images/how-to-submit/deploy-key.png.
Capture GitHub's "Add deploy key" form with title "MCP Grader", a dummy public
key, the unchecked "Allow write access" box, and the "Add key" button visible.
Include enough of the Settings sidebar to show "Deploy keys" is selected.
Once the image is saved, move the following image line outside this comment:
![GitHub deploy key form with write access left unchecked.](../images/how-to-submit/deploy-key.png)
-->

## 3. Configure the webhook

The webhook lets GitHub notify the grader when you push code to your repository.

1. In the same repository, go to **Settings → Webhooks → Add webhook**.
2. Fill in the settings below using the values returned by the submission page.
3. Click **Add webhook**.

| Setting | Value |
| --- | --- |
| Payload URL | Copy the webhook URL from the submission page. |
| Content type | `application/json` |
| Secret | Copy the webhook secret from the submission page exactly. |
| SSL verification | Leave SSL verification enabled. |
| Events | Select **Just the push event**. |
| Active | Leave this checked. |

Use the generated secret, rather than choosing a new one: the grader needs the matching value to verify notifications from GitHub. See [GitHub's webhook instructions](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks) for help finding these settings.

<!-- Screenshot 3: Save as static/images/how-to-submit/webhook.png.
Capture GitHub's "Add webhook" form showing the Payload URL, application/json,
a masked secret, enabled SSL verification, "Just the push event", "Active",
and the "Add webhook" button. Use a demo URL and never expose a real secret.
Once the image is saved, move the following image line outside this comment:
![GitHub webhook form configured for JSON payloads and push events.](../images/how-to-submit/webhook.png)
-->

## 4. Push your solution and check the results

Once both GitHub settings are in place, commit and push your solution to the branch required by the exercise. For later updates to the same repository and assignment, push your changes using the same setup.

Results may take time to appear. Check the exercise's leaderboard and compare the displayed commit hash with the commit you pushed. For details about update timing and viewing run output, see the [FAQ]({{< relref "faq.md" >}}).

## If something goes wrong

- **Registration fails:** read the error shown above the Submit button, check the selected assignment and repository URL, and make sure you used your university email address.
- **You cannot find the repository settings:** check that you opened your own assignment repository and have permission to manage its deploy keys and webhooks.
- **The grader cannot read your repository:** check that the complete deploy key was added to the same repository URL you registered.
- **Push notifications fail:** check the webhook URL, JSON content type, and secret. In GitHub's webhook settings, inspect **Recent deliveries** for failed requests.
- **Your result still shows an older commit:** check that you pushed to the expected branch and allow time for grading. Consult the FAQ before submitting the form again.
- **You lost the generated key or secret:** contact the course staff through the channels in the FAQ for help recovering access.

[Submit your project]({{< relref "submit.md" >}})
