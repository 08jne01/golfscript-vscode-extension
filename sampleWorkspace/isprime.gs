# Is prime?
83:x(,{x\)%!}%{+}*(!
#####################
# push 83 on stack
# assign 83 to x
# decrement item on stack (82)
# create array [0 -> 82]
# create code block push on stack {x\)%!}
# map code block on stack to elements in array

# map does as follows
# push item onto stack
# push x (83) onto stack
# swap stack and array item
# decrement item
# 83 % item
# logical not anything not zero becomes 0 and zero becomes 1

# {+}* folds using the {+} operation
# this sums the array
# ( decrement result
# ! not result