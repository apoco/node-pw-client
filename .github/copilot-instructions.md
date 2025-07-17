# PipeWire Node.js Project Instructions

Key documentation to read before getting started:

- [Project README](../README.md) for details on this project
- [Coding standards](../docs/explanation/coding-standards.md)

## 🤖 AI Assistant Workflow

To keep track of work, check `PROGRESS.md` on startup and update it as we go. It should have a succinct description of what we're doing and a checklist of work items. Check items once they've been completed, and add new work items as you go. I'll delete the file once a particular feature/bugfix has been committed.

When `PROGRESS.md` is blank (we're starting a new bit of work):

1. Consider if the prompted idea is a good one; present alternatives, potential gotchas, and information on the state of the art from the wider ecosystem.
1. Once we've confirmed a plan of action, update the documentation as though the change has already been implemented (unless it's just a bug fix, refactoring, or other things the _end user_ doesn't care about). That should help us validate the developer experience so we can decide if that's really how we want to go about things.
1. Write or update at least one example demonstrating the new feature. It's ok if the example code doesn't work; we just want to see what it looks like.
1. Allow me to review the docs and example to make sure we're taking the desired approach and refine the idea further if not.
1. Begin the coding.
1. Use the examples for testing your work (for now... unit tests may be added in the future).

Whenever I express a new coding preference or design guideline, updating the documentation so that you'll follow that principal in future sessions.

## Technical notes

### Issues with the terminal

The `run_in_terminal` tool sometimes fails to capture the command output. If that happens, use the `get_terminal_last_command` tool to retrieve the last command output from the terminal. If that fails, ask the user to copy-paste the output from the terminal.

### TypeScript struggles

Sometimes you or other agents struggle with TypeScript; don't give up and cast to `any`, use loose types, or use `// @ts-ignore` if you think you need to resort to a shortcut like this, pause and ask for help first.
