```python
def format_code(code_string):
    """
    Function to format the given code string to make it more readable.
    """
    import autopep8

    formatted_code = autopep8.fix_code(code_string)
    return formatted_code


def check_code_quality(code_string):
    """
    Function to check the quality of the given code string.
    """
    from pylint import epylint as lint

    (pylint_stdout, pylint_stderr) = lint.py_run(code_string, return_std=True)
    return pylint_stdout


def create_pr(branch_name, commit_message, github_repo):
    """
    Function to create a PR on the given GitHub repo.
    """
    from github import Github

    g = Github("<access_token>")
    repo = g.get_repo(github_repo)
    main = repo.get_branch("main")
    repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=main.commit.sha)
    repo.create_pull(title=commit_message, body="", head=branch_name, base="main")
```
