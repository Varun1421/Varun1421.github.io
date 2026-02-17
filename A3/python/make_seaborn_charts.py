import os
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# -----------------------------
# SETTINGS (toggle these)
# -----------------------------
ALSO_SAVE_BACKWARD_COMPAT_FILES = True  # saves extra filenames to avoid broken HTML links

BASE = os.path.dirname(os.path.dirname(__file__))   # .../A3
DATA = os.path.join(BASE, "data", "Online-eCommerce_A3_clean.csv")
OUT  = os.path.join(BASE, "images")
os.makedirs(OUT, exist_ok=True)

df = pd.read_csv(DATA)
df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce")
df["Total_Sales"] = pd.to_numeric(df["Total_Sales"], errors="coerce")
df = df.dropna(subset=["Category", "Quantity", "Total_Sales"])

sns.set_theme(style="whitegrid")

# ============================================================
# 1) HISTOGRAM — Total_Sales
# ============================================================
plt.figure(figsize=(10, 5))
ax = sns.histplot(data=df, x="Total_Sales", bins=30)
ax.set_xlim(0, df["Total_Sales"].max())
plt.xlabel("Total_Sales")
plt.ylabel("Count")
plt.title("Histogram of Total_Sales")
plt.grid(True, alpha=0.25)
plt.tight_layout()
plt.savefig(os.path.join(OUT, "hist_total_sales.png"), dpi=200)
plt.close()

# ============================================================
# 2) BOXPLOT 
# ============================================================
x = df["Total_Sales"].dropna()

q1 = x.quantile(0.25)
q3 = x.quantile(0.75)
iqr = q3 - q1
low = q1 - 1.5 * iqr
high = q3 + 1.5 * iqr

df["sales_outlier"] = (df["Total_Sales"] < low) | (df["Total_Sales"] > high)
outlier_count = int(df["sales_outlier"].sum())

plt.figure(figsize=(7, 5))

# Hide default fliers, we will plot outliers ourselves in red.
sns.boxplot(data=df, y="Total_Sales", showfliers=False)

# Overlay outliers
sns.stripplot(
    data=df[df["sales_outlier"]],
    y="Total_Sales",
    color="red",
    size=4,
    jitter=0.15
)

plt.xlabel("")
plt.ylabel("Total_Sales")
plt.title(f"Box Plot of Total_Sales (Outliers Highlighted: {outlier_count})")
plt.grid(True, alpha=0.25)
plt.tight_layout()

# main A+ filename
plt.savefig(os.path.join(OUT, "box_total_sales_outliers.png"), dpi=200)

# backward-compat (optional): keep your old filename working, but note it's now Total_Sales
if ALSO_SAVE_BACKWARD_COMPAT_FILES:
    plt.savefig(os.path.join(OUT, "box_quantity.png"), dpi=200)

plt.close()

# ============================================================
# 3) STRIP PLOT — Total_Sales by Category with jitter
# ============================================================
top_cats = df["Category"].value_counts().head(10).index
df_top = df[df["Category"].isin(top_cats)].copy()

plt.figure(figsize=(12, 6))
sns.stripplot(data=df_top, x="Category", y="Total_Sales", jitter=True, alpha=0.6)
plt.xlabel("Category (top 10)")
plt.ylabel("Total_Sales")
plt.title("Strip Plot of Total_Sales by Category (with jitter)")
plt.xticks(rotation=25, ha="right")
plt.grid(True, alpha=0.25)
plt.tight_layout()

plt.savefig(os.path.join(OUT, "strip_total_sales_by_category.png"), dpi=200)

# backward-compat optional extra name
if ALSO_SAVE_BACKWARD_COMPAT_FILES:
    plt.savefig(os.path.join(OUT, "strip_sales_by_category.png"), dpi=200)

plt.close()

print("Saved seaborn charts to:", OUT)
print("Boxplot outliers (Total_Sales):", outlier_count)
