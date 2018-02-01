rm -rf dist;
rm -rf docs/code;
tsc && find src -name '*.ts' | xargs standardts && typedoc src/ --out docs/code;
