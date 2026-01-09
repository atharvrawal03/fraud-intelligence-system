#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <cmath>
#include <ctime>
#include <nlohmann/json.hpp>

using json = nlohmann::json;
using namespace std;

// ---------------- DATA MODEL ----------------
struct Transaction {
    string date;
    string time;
    long long amount;
    string location;
};

// ---------------- TIME UTILS ----------------
time_t datetotime(const string &date) {
    struct tm tm{};
    sscanf(date.c_str(), "%d-%d-%d", &tm.tm_year, &tm.tm_mon, &tm.tm_mday);
    tm.tm_year -= 1900;
    tm.tm_mon -= 1;
    return mktime(&tm);
}

int timeDiffMinutes(const string &t1, const string &t2) {
    int h1, m1, h2, m2;
    sscanf(t1.c_str(), "%d:%d", &h1, &m1);
    sscanf(t2.c_str(), "%d:%d", &h2, &m2);
    return abs((h2 * 60 + m2) - (h1 * 60 + m1));
}

double computeDaysRange(const vector<Transaction>& tx) {
    time_t minT = -1, maxT = -1;
    for (auto &t : tx) {
        time_t d = datetotime(t.date);
        if (minT == -1 || d < minT) minT = d;
        if (maxT == -1 || d > maxT) maxT = d;
    }
    double days = difftime(maxT, minT) / 86400.0;
    return max(1.0, days);
}

// ---------------- RULE: PERIOD ----------------
pair<int,int> analysePeriod(const vector<Transaction>& tx, double days) {
    long long total = 0;
    int highCount = 0;

    for (auto &t : tx) {
        total += t.amount;
        if (t.amount >= 200000) highCount++;
    }

    int status = 0;

    if (days <= 7) {
        if (total >= 200000) status = 2;
        else if (total >= 50000) status = 1;
    }
    else if (days <= 30) {
        if (total > 2000000) status = 2;
        else if (total >= 1000000) status = 1;
    }
    else {
        if (total > 5000000) status = 2;
        else if (total >= 3000000) status = 1;
    }

    return {status, highCount};
}

// ---------------- RULE: TIME BURST ----------------
int analyseTime(const vector<Transaction>& tx) {
    unordered_map<string, vector<Transaction>> perDate;
    for (auto &t : tx) perDate[t.date].push_back(t);

    int result = 0;

    for (auto &d : perDate) {
        auto &v = d.second;
        sort(v.begin(), v.end(), [](auto &a, auto &b) {
            return a.time < b.time;
        });

        for (int i = 0; i < (int)v.size(); i++) {
            int cnt = 1;
            for (int j = i+1; j < (int)v.size(); j++) {
                if (timeDiffMinutes(v[i].time, v[j].time) <= 10)
                    cnt++;
                else break;
            }
            if (cnt > 5) return 2;
            if (cnt >= 2) result = max(result, 1);
        }
    }
    return result;
}

// ---------------- RULE: LOCATION JUMP ----------------
int analyseLocation(const vector<Transaction>& tx) {
    unordered_map<string, vector<Transaction>> perDate;
    for (auto &t : tx) perDate[t.date].push_back(t);

    int result = 0;

    for (auto &d : perDate) {
        auto &v = d.second;
        sort(v.begin(), v.end(), [](auto &a, auto &b) {
            return a.time < b.time;
        });

        for (int i = 1; i < (int)v.size(); i++) {
            int diff = timeDiffMinutes(v[i-1].time, v[i].time);
            if (v[i-1].location != v[i].location && diff <= 15)
                return 2;
            if (v[i-1].location != v[i].location && diff <= 30)
                result = max(result, 1);
        }
    }
    return result;
}

// ---------------- API ENTRY ----------------
int main() {
    
    string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());

    json req = json::parse(input);
    vector<Transaction> tx;

    for (auto &t : req["transactions"]) {
        tx.push_back({
            t["date"],
            t["time"],
            t["amount"],
            t["location"]
        });
    }

    double days = computeDaysRange(tx);

    auto period = analysePeriod(tx, days);
    int timeRule = analyseTime(tx);
    int locRule  = analyseLocation(tx);

    int finalRule = max({period.first, timeRule, locRule});

    int cappedHigh = min(3, period.second);
    int sum = period.first + timeRule + locRule + cappedHigh;
    double riskScore = (sum / 9.0) * 10.0;

    json res = {
        {"period_rule", period.first},
        {"time_rule", timeRule},
        {"location_rule", locRule},
        {"high_value_count", period.second},
        {"risk_score", round(riskScore * 100) / 100},
        {"final_status", finalRule == 2 ? "Suspicious" :
                         finalRule == 1 ? "Alert" : "Normal"}
    };

    cout << res.dump();
    return 0;
}
