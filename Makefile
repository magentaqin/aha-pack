
#	this will show you the stages of babel. You can re-engineer it as you like.
make babel-playground:
	node ./how-babel-works/playground

#	transform code that has spread operator syntax to old standard syntax.
make my-first-babel-plugin:
	node ./how-babel-works/my-first-babel-plugin