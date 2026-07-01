import pandas as pd
file_path = r"c:\Users\admin_artdecon\Documents\desarrollo\volantes_pago\Tira de Pago  BASICO TOP TALENT JUNIO 2026.xls"
df = pd.read_excel(file_path, header=None)

# Find start rows of each block
start_rows = []
for idx, row in df.iterrows():
    row_str = " ".join([str(x) for x in row if pd.notna(x)])
    if "TOP TALENT" in row_str or "ARTDECON" in row_str:
        start_rows.append(idx)

# For each block, show start row and what is at offset + 5
for idx, start in enumerate(start_rows):
    if start + 5 < df.shape[0]:
        val = df.iloc[start + 5].values
        print(f"Block {idx:03d} (Row {start:04d}): Offset +5: {list(val)}")
