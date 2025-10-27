import yfinance as yf
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.preprocessing import StandardScaler
import joblib

def train_model(symbol="TMC"):
    df = yf.download(symbol, period="10y", interval="1d")
    df["RSI"] = compute_rsi(df["Close"], 14)
    df["EMA20"] = df["Close"].ewm(span=20).mean()
    df["EMA50"] = df["Close"].ewm(span=50).mean()
    df["MACD"] = df["Close"].ewm(12).mean() - df["Close"].ewm(26).mean()
    df["Target"] = (df["Close"].shift(-5) > df["Close"]).astype(int)

    feats = ["RSI","EMA20","EMA50","MACD","Volume"]
    X = StandardScaler().fit_transform(df[feats].fillna(0))
    y = df["Target"].fillna(0)
    model = LGBMClassifier(n_estimators=500, learning_rate=0.01)
    model.fit(X, y)
    joblib.dump(model, f"models/{symbol}_model.pkl")
    print(f"✅ Trained model saved for {symbol}")
    return model

def compute_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta>0,0)).rolling(window=period).mean()
    loss = (-delta.where(delta<0,0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100/(1+rs))

if __name__ == "__main__":
    for s in ["TMC","PLTR","SLDP","ENVX","QS","BEEM"]:
        train_model(s)
