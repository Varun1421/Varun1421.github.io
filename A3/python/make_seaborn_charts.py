import os
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

BASE = os.path.dirname(os.path.dirname(__file__))   # .../a3
DATA = os.path.join(BASE, "data", "Online-eCommerce_A3_clean.csv")
OUT  = os.path.join(BASE, "images")
os.makedirs(OUT, exist_ok=True)

df = pd.read_csv(DATA)
df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce")
df["Total_Sales"] = pd.to_numeric(df["Total_Sales"], errors="coerce")
df = df.dropna(subset=["Category", "Quantity", "Total_Sales"])

sns.set_theme(style="whitegrid")

# 1) Histogram (Total_Sales)
plt.figure(figsize=(10,5))
sns.histplot(data=df, x="Total_Sales", bins=30)
plt.xlabel("Total_Sales")
plt.ylabel("Count")
plt.title("Histogram of Total_Sales")
plt.grid(True, alpha=0.25)
plt.tight_layout()
plt.savefig(os.path.join(OUT, "hist_total_sales.png"), dpi=200)
plt.close()

# 2) Boxplot with OUTLIERS highlighted (Quantity)
# Compute outliers using 1.5*IQR rule
q1 = df["Quantity"].quantile(0.25)
q3 = df["Quantity"].quantile(0.75)
iqr = q3 - q1
low = q1 - 1.5 * iqr
high = q3 + 1.5 * iqr
df["is_outlier"] = (df["Quantity"] < low) | (df["Quantity"] > high)

plt.figure(figsize=(6,5))
sns.boxplot(data=df, y="Quantity", showfliers=True)
# overlay outliers in red
sns.stripplot(data=df[df["is_outlier"]], y="Quantity", color="red", size=4, jitter=0.15)
plt.xlabel("")
plt.ylabel("Quantity")
plt.title("Box Plot of Quantity (Outliers Highlighted)")
plt.grid(True, alpha=0.25)
plt.tight_layout()
plt.savefig(os.path.join(OUT, "box_quantity_outliers.png"), dpi=200)
plt.close()

# 3) Strip plot with jitter (Total_Sales by Category, top 10 cats)
top_cats = df["Category"].value_counts().head(10).index
df_top = df[df["Category"].isin(top_cats)].copy()

plt.figure(figsize=(12,6))
sns.stripplot(data=df_top, x="Category", y="Total_Sales", jitter=True, alpha=0.6)
plt.xlabel("Category (top 10)")
plt.ylabel("Total_Sales")
plt.title("Strip Plot of Total_Sales by Category (with jitter)")
plt.xticks(rotation=25, ha="right")
plt.grid(True, alpha=0.25)
plt.tight_layout()
plt.savefig(os.path.join(OUT, "strip_sales_by_category.png"), dpi=200)
plt.close()

print("Saved seaborn charts to:", OUT)
