rm -rf dist;
rm -rf docs;
tsc && find src -name '*.ts' | xargs standardts && typedoc src/ --out docs;
