---
title: "FAQ"
description: "Frequently Asked Questions about the leaderboard system."
date: "2026-10-20"
author: "Daniele De Sensi"
draft: false
---

## > I lost my Webhook secret or deploy key, how do I recover them?
Recovering your keys is easy, just visit the [secret recovery page]({{< relref "recover-secrets.md" >}}). You will send an email and receive your credentials back, also via email. You will get everything back in less than 5 minutes. If it doesn't work look at the "[Still having problems?](#-still-having-problems)" section

## > What is this leaderboard about?
This leaderboard tracks and displays the performance of students on the programming exercises offered in the course. It ranks users based on their runtimes. The better you parallelize and optimize your code, the higher you will rank.

## > How often is the leaderboard updated?
The leaderboard is updated every time a student pushes an update to their repository. Of course there is a delay between your push and the grader running your code, so please allow a few minutes of slack. Once the grader has picked up your submission a green blinking dot will appear next to your username in the leaderboard. Old results will be visible until new results are available.

## > Why is my result not changing after I submit a new solution?
If you've waited a few minutes and your result is still not changing, it's possible that the specific assignment you pushed to has a cooldown timer. It can happen that if you push too many times in a short period of time, the grader will delay the grading of your submission until the cooldown timer elapsed. If after 10-15 minutes your result is still not changing (check the hash of your commit), please make sure that you're pushing to the correct branch (usually `main` or `master`). If the problem persists, have a look at "[Still having problems?](#-still-having-problems)" section

## > Can I see more detailed informations about my run?
Yes, you can view more details (like stdout and stderr) by clicking on your row (your username) in the leaderboard. Use it to understand what's happening during the execution of your code.

## > How do I submit my project?
Please follow the instructions in the [How to submit your project]({{< relref "how-to-submit.md" >}}) page.

## > What does Execution timed out after X seconds mean?
This means that your code took too long to run. The grader has a timeout limit for each assignment, this limit is usually permissive enough to allow a basic parallel implementation to run. If you believe your code is correct and should run in time, look at [Still having problems?](#-still-having-problems)

## > How do I download artifacts from the grader?
You can download the artifacts in a zip file by going to the artifact page and inserting the secret key you received when you submitted your project. 

## > Still having problems?
If you still have a problem you can't solve, please write it either on the "Programmazione di sistemi embedded e multicore" telegram group (you can find the link [here](https://t.me/sapienzainformatica3)) or send an email to mcp [at] francescodb.it. The telegram group is usually the fastest way to get help.
