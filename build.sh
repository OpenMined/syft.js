rm -rf dist;
rm -rf docs;
tsc && find src -name '*.ts' | xargs standardts && typedoc --theme minimal src/ --out docs;
