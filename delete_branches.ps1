$branches = git branch --format='%(refname:short)'
foreach ($branch in $branches) {
    if ($branch -ne 'main') {
        git branch -D $branch
    }
}


