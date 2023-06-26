
VERSION=$(cat package.json | grep "\"version\"" | sed -r 's/"version": "(.*)".*/\1/g')

echo "Current version $VERSION" 
echo -n "New version: " 

read NEW_VERSION

echo "Setting version to \"$NEW_VERSION\""

echo "In package.json ..."
sed -i -r "s/\"version\": \"(.*)\"/\"version\": \"$NEW_VERSION\"/g" package.json
echo "In bower.json ..."
sed -i -r "s/\"version\": \"(.*)\"/\"version\": \"$NEW_VERSION\"/g" bower.json

echo "Running grunt ..."
grunt

echo "git add package.json bower.json klay.js"
git add package.json bower.json klay.js

echo "git commit -m \"Updated to $NEW_VERSION\""
git commit -m "Updated to $NEW_VERSION"

echo "git tag -a $NEW_VERSION -m \"Tagging to $NEW_VERSION\""
git tag -a $NEW_VERSION -m "Tagging to $NEW_VERSION"

echo -n "Push? "
read PUSH
if [ "$PUSH" = "y" ]; then
  echo "git push origin master --tags"
  git push origin master --tags
fi

echo -n "Publish to npm? "
read PUBLISH

if [ "$PUBLISH" = "y" ]; then
  echo "npm publish"
  npm publish
fi