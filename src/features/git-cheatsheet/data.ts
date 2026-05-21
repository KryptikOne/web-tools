export interface GitCommand {
	command: string;
	description: string;
	example: string;
}

export interface GitCategory {
	name: string;
	commands: GitCommand[];
}

export const GIT_CATEGORIES: GitCategory[] = [
	{
		name: "Setup",
		commands: [
			{
				command: "git config --global user.name \"<name>\"",
				description: "Set the name attached to your commits.",
				example: "git config --global user.name \"Jane Doe\"",
			},
			{
				command: "git config --global user.email \"<email>\"",
				description: "Set the email attached to your commits.",
				example: "git config --global user.email \"jane@example.com\"",
			},
			{
				command: "git config --global init.defaultBranch <name>",
				description: "Choose the default branch name for new repos.",
				example: "git config --global init.defaultBranch main",
			},
			{
				command: "git config --global core.editor <editor>",
				description: "Set the editor Git uses for commit messages, rebase, etc.",
				example: "git config --global core.editor \"code --wait\"",
			},
			{
				command: "git init",
				description: "Initialize a new repository in the current directory.",
				example: "git init",
			},
			{
				command: "git clone <url>",
				description: "Clone a remote repository to a local directory.",
				example: "git clone git@github.com:org/repo.git",
			},
		],
	},
	{
		name: "Branches",
		commands: [
			{
				command: "git branch",
				description: "List local branches; the current one is starred.",
				example: "git branch",
			},
			{
				command: "git branch -a",
				description: "List local and remote-tracking branches.",
				example: "git branch -a",
			},
			{
				command: "git branch <name>",
				description: "Create a new branch from the current commit.",
				example: "git branch feature/login",
			},
			{
				command: "git switch <branch>",
				description: "Switch to an existing branch (modern alternative to checkout).",
				example: "git switch develop",
			},
			{
				command: "git switch -c <name>",
				description: "Create a new branch and switch to it.",
				example: "git switch -c feature/login",
			},
			{
				command: "git checkout <branch>",
				description: "Classic branch switch (still works everywhere).",
				example: "git checkout main",
			},
			{
				command: "git branch -d <name>",
				description: "Delete a branch that has been merged.",
				example: "git branch -d feature/login",
			},
			{
				command: "git branch -D <name>",
				description: "Force-delete a branch even if unmerged.",
				example: "git branch -D experiment",
			},
			{
				command: "git branch -m <new>",
				description: "Rename the current branch.",
				example: "git branch -m main",
			},
			{
				command: "git merge <branch>",
				description: "Merge another branch into the current one.",
				example: "git merge feature/login",
			},
			{
				command: "git rebase <branch>",
				description: "Replay current branch's commits on top of another branch.",
				example: "git rebase main",
			},
		],
	},
	{
		name: "Commits",
		commands: [
			{
				command: "git status",
				description: "Show working tree status (staged, unstaged, untracked).",
				example: "git status",
			},
			{
				command: "git add <path>",
				description: "Stage a file or directory for the next commit.",
				example: "git add src/app.ts",
			},
			{
				command: "git add -p",
				description: "Interactively stage hunks of changes.",
				example: "git add -p",
			},
			{
				command: "git add .",
				description: "Stage every change in the current directory.",
				example: "git add .",
			},
			{
				command: "git restore --staged <path>",
				description: "Unstage a file while keeping the working-tree changes.",
				example: "git restore --staged src/app.ts",
			},
			{
				command: "git commit -m \"<message>\"",
				description: "Create a commit with the given message.",
				example: "git commit -m \"fix: handle null user\"",
			},
			{
				command: "git commit -am \"<message>\"",
				description: "Stage all tracked, modified files and commit.",
				example: "git commit -am \"chore: bump deps\"",
			},
			{
				command: "git commit --amend",
				description: "Replace the last commit (message and/or contents).",
				example: "git commit --amend --no-edit",
			},
		],
	},
	{
		name: "Remotes",
		commands: [
			{
				command: "git remote -v",
				description: "Show configured remotes and their URLs.",
				example: "git remote -v",
			},
			{
				command: "git remote add <name> <url>",
				description: "Add a new remote repository.",
				example: "git remote add origin git@github.com:org/repo.git",
			},
			{
				command: "git remote set-url <name> <url>",
				description: "Change the URL of an existing remote.",
				example: "git remote set-url origin git@github.com:org/repo.git",
			},
			{
				command: "git fetch <remote>",
				description: "Download new commits from a remote without merging.",
				example: "git fetch origin",
			},
			{
				command: "git pull",
				description: "Fetch and integrate changes from the upstream branch.",
				example: "git pull",
			},
			{
				command: "git pull --rebase",
				description: "Fetch then replay local commits on top of upstream.",
				example: "git pull --rebase origin main",
			},
			{
				command: "git push",
				description: "Send local commits to the upstream branch.",
				example: "git push",
			},
			{
				command: "git push -u <remote> <branch>",
				description: "Push and set the upstream tracking reference.",
				example: "git push -u origin feature/login",
			},
			{
				command: "git push --force-with-lease",
				description: "Force push, but only if the remote hasn't moved.",
				example: "git push --force-with-lease",
			},
		],
	},
	{
		name: "Stash",
		commands: [
			{
				command: "git stash",
				description: "Save uncommitted changes and revert to clean working tree.",
				example: "git stash",
			},
			{
				command: "git stash -u",
				description: "Stash including untracked files.",
				example: "git stash -u",
			},
			{
				command: "git stash push -m \"<message>\"",
				description: "Stash with a descriptive name.",
				example: "git stash push -m \"wip: login form\"",
			},
			{
				command: "git stash list",
				description: "List all stashes.",
				example: "git stash list",
			},
			{
				command: "git stash pop",
				description: "Apply the latest stash and remove it from the stash stack.",
				example: "git stash pop",
			},
			{
				command: "git stash apply <ref>",
				description: "Apply a specific stash without removing it.",
				example: "git stash apply stash@{1}",
			},
			{
				command: "git stash drop <ref>",
				description: "Discard a specific stash entry.",
				example: "git stash drop stash@{0}",
			},
		],
	},
	{
		name: "History",
		commands: [
			{
				command: "git log",
				description: "Show commit history of the current branch.",
				example: "git log",
			},
			{
				command: "git log --oneline --graph --decorate --all",
				description: "Compact graph view of the entire history.",
				example: "git log --oneline --graph --decorate --all",
			},
			{
				command: "git log -p <path>",
				description: "Show commit history with diffs for a file.",
				example: "git log -p src/auth.ts",
			},
			{
				command: "git log --author=<name>",
				description: "Filter history by author.",
				example: "git log --author=jane",
			},
			{
				command: "git log --since=<date>",
				description: "Show commits newer than a given date.",
				example: "git log --since=\"2 weeks ago\"",
			},
			{
				command: "git shortlog -sn",
				description: "Summarize commits per author (sorted, numbered).",
				example: "git shortlog -sn",
			},
			{
				command: "git blame <file>",
				description: "Show who last modified each line of a file.",
				example: "git blame src/app.ts",
			},
			{
				command: "git reflog",
				description: "Show movements of HEAD — invaluable for recovering lost commits.",
				example: "git reflog",
			},
		],
	},
	{
		name: "Undo",
		commands: [
			{
				command: "git restore <file>",
				description: "Discard working-tree changes for a file.",
				example: "git restore src/app.ts",
			},
			{
				command: "git restore --source=<commit> <file>",
				description: "Restore a file from a specific commit.",
				example: "git restore --source=HEAD~1 src/app.ts",
			},
			{
				command: "git reset HEAD <file>",
				description: "Unstage a file (legacy form of restore --staged).",
				example: "git reset HEAD src/app.ts",
			},
			{
				command: "git reset --soft HEAD~1",
				description: "Undo the last commit but keep changes staged.",
				example: "git reset --soft HEAD~1",
			},
			{
				command: "git reset --mixed HEAD~1",
				description: "Undo the last commit and unstage the changes (default).",
				example: "git reset --mixed HEAD~1",
			},
			{
				command: "git reset --hard HEAD~1",
				description: "Discard the last commit and all its changes. Dangerous.",
				example: "git reset --hard HEAD~1",
			},
			{
				command: "git revert <commit>",
				description: "Create a new commit that undoes a previous one (safe for shared history).",
				example: "git revert a1b2c3d",
			},
			{
				command: "git clean -fd",
				description: "Delete untracked files and directories. Use --dry-run first.",
				example: "git clean -fd",
			},
		],
	},
	{
		name: "Tags",
		commands: [
			{
				command: "git tag",
				description: "List existing tags.",
				example: "git tag",
			},
			{
				command: "git tag <name>",
				description: "Create a lightweight tag at HEAD.",
				example: "git tag v1.0.0",
			},
			{
				command: "git tag -a <name> -m \"<message>\"",
				description: "Create an annotated tag (preferred for releases).",
				example: "git tag -a v1.0.0 -m \"Release 1.0.0\"",
			},
			{
				command: "git push <remote> <tag>",
				description: "Push a single tag to a remote.",
				example: "git push origin v1.0.0",
			},
			{
				command: "git push --tags",
				description: "Push all local tags to the remote.",
				example: "git push --tags",
			},
			{
				command: "git tag -d <name>",
				description: "Delete a local tag.",
				example: "git tag -d v1.0.0",
			},
			{
				command: "git push <remote> --delete <tag>",
				description: "Delete a tag on the remote.",
				example: "git push origin --delete v1.0.0",
			},
		],
	},
	{
		name: "Diff / Inspect",
		commands: [
			{
				command: "git diff",
				description: "Show unstaged changes vs the index.",
				example: "git diff",
			},
			{
				command: "git diff --staged",
				description: "Show what would be committed.",
				example: "git diff --staged",
			},
			{
				command: "git diff <a>..<b>",
				description: "Show diff between two refs.",
				example: "git diff main..feature/login",
			},
			{
				command: "git diff --stat",
				description: "Summarize changes per file (lines +/-).",
				example: "git diff --stat",
			},
			{
				command: "git show <commit>",
				description: "Show the content of a commit (message + diff).",
				example: "git show a1b2c3d",
			},
			{
				command: "git cherry-pick <commit>",
				description: "Apply the changes from a single commit onto the current branch.",
				example: "git cherry-pick a1b2c3d",
			},
			{
				command: "git bisect start / good / bad",
				description: "Binary-search history to find the commit that introduced a bug.",
				example: "git bisect start && git bisect bad && git bisect good v1.0",
			},
		],
	},
];
