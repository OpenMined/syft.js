#!/usr/bin/env bash
rm -rf ./tmp
mkdir tmp

for directory in $(find ./examples -type d -mindepth 1 -maxdepth 1); 
do
  directory="$directory/dist/"
  name="$(cut -d'/' -f3 <<<$directory)"

  rsync -avzh "$directory" "./tmp/$name"
done