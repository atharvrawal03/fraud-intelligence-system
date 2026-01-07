#include<iostream>
#ifdef _WIN32
#include <windows.h>
#endif
#include<fstream>
#include<unordered_map>
#include<sstream>
#include<vector>
#include<algorithm>
#include<ctime>
#include<iomanip>
#include<queue>
#include<unordered_set>
#include<cmath>
using namespace std;

struct Transaction{
    string trans_id;
    string acc_id;
    string date;
    string time;
    string amount;
    string location;
};

unordered_map<string, vector<Transaction>> accounts;

time_t datetotime(const string &date) {
    struct tm tm{};
    sscanf(date.c_str(), "%d-%d-%d", &tm.tm_year, &tm.tm_mon, &tm.tm_mday);
    tm.tm_year -= 1900; 
    tm.tm_mon -= 1;     
    tm.tm_hour = 0;
    tm.tm_min = 0;
    tm.tm_sec = 0;
    return mktime(&tm);
}

int timeToInt(const string &t) {
    int h = 0, m = 0;
    sscanf(t.c_str(), "%d:%d", &h, &m);
    return h * 100 + m;
}

// Get absolute difference in minutes between two times (same day)
int timeDiffMinutes(const string &t1, const string &t2) {
    int h1, m1, h2, m2;
    sscanf(t1.c_str(), "%d:%d", &h1, &m1);
    sscanf(t2.c_str(), "%d:%d", &h2, &m2);
    return abs((h2 * 60 + m2) - (h1 * 60 + m1));
}

string trim(const string &s) {
    size_t start = s.find_first_not_of(" \r\n\t");
    size_t end = s.find_last_not_of(" \r\n\t");
    if (start == string::npos) return "";
    return s.substr(start, end - start + 1);
}

double computeDaysRange(const vector<Transaction>& tx) {
    time_t minT = (time_t)(-1), maxT = (time_t)(-1);
    for (auto &tr : tx) {
        time_t t = datetotime(tr.date);
        if (t == (time_t)(-1)) continue;
        if (minT == (time_t)(-1) || t < minT) minT = t;
        if (maxT == (time_t)(-1) || t > maxT) maxT = t;
    }
    if (minT == (time_t)(-1) || maxT == (time_t)(-1)) return 1.0; // fallback 1 day
    double diffSec = difftime(maxT, minT);
    double days = diffSec / 86400.0;
    if (days < 1.0) days = 1.0; // at least 1 day
    return days;
}


void loadaccounts(){

    ifstream account_file("transactions.txt");

    if(!account_file){
        cout<<"No account found";
        return;
    }

    string id;

    while(getline(account_file,id)){
        
        stringstream ss(id);
        string acc_id, trans_id, date, location;
        string time, amount;

        if (getline(ss,trans_id,'|') &&
            getline(ss,acc_id,'|') &&
            getline(ss,date,'|') &&
            getline(ss,time,'|') &&
            getline(ss,amount,'|') &&
            getline(ss,location,'|'))
            {

            Transaction t{trans_id, acc_id, date,time, amount,location};
            accounts[acc_id].push_back(t);
        }


    }

    account_file.close();
}

void loadalltransactions(){
    int totalacc = 0; int totaltxn = 0;
    for(auto& pair: accounts){
         totalacc = accounts.size();

        totaltxn += pair.second.size();
    }
    cout << "\n══════════════════════════════════════════════════════\n";
    cout<<"🕹️  Total "<<totaltxn<<" transactions done from "<<totalacc<<" accounts."<<endl;
    cout << "══════════════════════════════════════════════════════\n";

}

void displayaccounts() {
    for (auto &pair : accounts) {
        cout << "\nAccount ID: " << pair.first << endl;
        cout << "Transactions:\n";
        for (auto &t : pair.second) {
            cout << "  Transaction ID: " << t.trans_id
                 << " | Date: " << t.date
                 << " | Time: " << t.time
                 << " | Amount: " << t.amount
                 << " | Location: " << t.location << endl;
        }
    }
}

void analysedates(){
    for (auto &pair : accounts){
        string acc = pair.first;
        vector<Transaction> &t = pair.second;

        unordered_map<string, long long> dailytotal;

        for(auto &p : t){
            long long amt = stoi(p.amount);
            dailytotal[p.date] += amt;
        }

        for(auto &one : dailytotal){
            cout<<acc<<endl;
            cout<<"\nFor date: "<<one.first<<" , Total amount transacted: "<<one.second<<endl;

            if(one.second < 50000){
                cout<<"Normal Transaction"<<endl;
            }
            else if(one.second>50000 && one.second<200000){
                cout<<"Alert"<<endl;
            }
            else{ cout<<"Suspicious "<<endl;}
        }
    }
}


pair<int,int> analyseperiod(const vector<Transaction>& tx, double days_diff) {

    int overallflag = 0; // 0: normal, 1: alert, 2: suspicious
    int highvaluecount = 0;

        long long grandtotal = 0;
        const long long HIGH_LIMIT = 200000;

        for (auto &one : tx){
                long long amount = stoll(one.amount);
                grandtotal += amount;

                if(amount>HIGH_LIMIT){
                    highvaluecount++;
                }
        }

        if (grandtotal == 0) {
            return {0,0};
        }
        int status = 0;
        string reason;

        if(days_diff<=7){
        if (grandtotal < 50000){
            status = 0; reason = "Low weekly spending — within safe range.";}
        else if (grandtotal >= 50000 && grandtotal < 200000){
            status = 1; reason = "Medium weekly volume — check for unusual patterns.";}
        else{
            status = 2; reason = "Very high weekly spending — possible abnormal activity.";
        }
        }

        else if(days_diff>=7 && days_diff<=30){
            if (grandtotal < 1000000){
           status = 0; reason = "Monthly total within normal spending limit.";}
        else if (grandtotal >= 1000000 && grandtotal <= 2000000){
            status = 1; reason = "Unusually high monthly spending — monitor account.";
        }
        else{
            status = 2; reason = "Excessive monthly spending — possible laundering or misuse.";
        }
    }

        else{
            if (grandtotal < 3000000){
            status = 0; reason = "Long-term spending normal.";}
        else if (grandtotal >= 3000000 && grandtotal <= 5000000){
            status = 1; reason = "Moderate increase — possible business expansion or cash flow surge.";}
        else{
            status = 2; reason = "Extremely high spending — investigate for fraud or layered transactions.";
            }
        
        
    }
        overallflag = max(overallflag, status);
        return {overallflag,highvaluecount}; 
}



int analysetime(const vector<Transaction>& tx) {

    int finalresult = 0; // 0: normal, 1: alert, 2: suspicious

    // Group transactions by date
    unordered_map<string, vector<Transaction>> perDate;
    for (const auto &t : tx) perDate[t.date].push_back(t);

    for (auto &day : perDate) {
        vector<Transaction> dayTx = day.second;

        // sort by time for that day
        sort(dayTx.begin(), dayTx.end(), [](const Transaction &a, const Transaction &b) {
            return a.time < b.time;
        });

        for (int i = 0; i < (int)dayTx.size(); i++) {
            int count10 = 1;
            for (int j = i + 1; j < (int)dayTx.size(); j++) {
                int diff = timeDiffMinutes(dayTx[i].time, dayTx[j].time);
                if (diff <= 10) count10++;
                else break;
            }

            if (count10 > 5) {
                finalresult = max(finalresult, 2);
                break; // this date is already suspicious, go to next date
            } else if (count10 >= 2 && count10 <= 5) {
                finalresult = max(finalresult, 1);
                // don't break here — a later window that day might be worse, but you can break too
            }
        }
        // if global highest is already suspicious, no need to continue dates
        if (finalresult == 2) break;
    }

    return finalresult;
}


int analyzelocation(const vector<Transaction>& tx) {

    int finalResult = 0;

    // group by date
    unordered_map<string, vector<Transaction>> perDate;

    for (auto &t : tx)
        perDate[t.date].push_back(t);

    // check each date separately
    for (auto &day : perDate) {

        vector<Transaction> dayTx = day.second;

        sort(dayTx.begin(), dayTx.end(),
             [](const Transaction &a, const Transaction &b) {
                 return a.time < b.time;
             });

        for (int i = 0; i < (int)dayTx.size() - 1; i++) {

            string loc1 = dayTx[i].location;
            string loc2 = dayTx[i + 1].location;

            // SAME DAY ONLY
            int diff = timeDiffMinutes(dayTx[i].time, dayTx[i + 1].time);

            // Different city + VERY fast change → SUSPICIOUS
            if (loc1 != loc2 && diff <= 15) {
                finalResult = max(finalResult, 2);
            }
            // Different city + moderately fast → ALERT
            else if (loc1 != loc2 && diff <= 30) {
                finalResult = max(finalResult, 1);
            }
        }
    }

    return finalResult;
}


void datewiseanalysis() {
    unordered_map<string, vector<Transaction>> datewise;

    for (auto& it : accounts) {
        string acc = it.first;
        vector<Transaction>& txs = it.second;
        for (auto& t : txs)
            datewise[t.date].push_back(t);
    }

    string target_date;
    cout << "\n══════════════════════════════════════════════════════\n";
    cout << "              DATE-WISE TRANSACTION ANALYSIS           \n";
    cout << "══════════════════════════════════════════════════════\n";
    cout << "Enter date to analyze (yyyy-mm-dd): ";
    cin >> target_date;

    if (datewise.find(target_date) == datewise.end()) {
        cout << "\n⚠ No transactions found for this date.\n";
        cout << "══════════════════════════════════════════════════════\n";
        return;
    }

    vector<Transaction> daytxn = datewise[target_date];

    cout << "\n\n📅 Summary Report for " << target_date << "\n";
    cout << "══════════════════════════════════════════════════════\n";

    unordered_map<string, vector<Transaction>> accwise;
    for (auto& a : daytxn)
        accwise[a.acc_id].push_back(a);

    int totaltxn = daytxn.size();
    int suscount = 0, alertcount = 0, normalcount = 0;

    struct Row {
        string acc;
        int txns;
        int highvalue;
        int status;
    };
    vector<Row> resultRows;

    for (auto& t : accwise) {
        string acc = t.first;
        vector<Transaction> acctx;
        for (auto& ac : daytxn)
            if (ac.acc_id == acc)
                acctx.push_back(ac);

        pair<int, int> result = analyseperiod(acctx, 1);
        int one = result.first;
        int highvaluecount = result.second;
        int two = analysetime(acctx);
        int three = analyzelocation(acctx);

        int finalresult = max({one, two, three});

        resultRows.push_back({acc, (int)acctx.size(), highvaluecount, finalresult});

        if (finalresult == 2)
            suscount++;
        else if (finalresult == 1)
            alertcount++;
        else
            normalcount++;
    }

    cout << left << setw(25) << "Total Transactions" << ": " << totaltxn << "\n\n";
    cout << left << setw(25) << "Suspicious Accounts" << ": " << suscount << "\n";
    cout << left << setw(25) << "Alert Accounts" << ": " << alertcount << "\n";
    cout << left << setw(25) << "Normal Accounts" << ": " << normalcount << "\n";
    cout << "══════════════════════════════════════════════════════\n";

    char choice;
    cout << "Do you want a detailed summary? (Y/N): ";
    cin >> choice;

    if (choice == 'Y' || choice == 'y') {
        cout << "\n\n📘 FRAUD DETECTION DETAILED REPORT\n";
        cout << "══════════════════════════════════════════════════════\n";
        cout << left << setw(15) << "Account ID"
             << setw(15) << "Total Txns"
             << setw(22) << "High-Value Txns"
             << "Status\n";
        cout << "──────────────────────────────────────────────────────\n";

        for (auto& row : resultRows) {
            cout << left << setw(15) << row.acc
                 << setw(15) << row.txns
                 << setw(22) << row.highvalue;

            if (row.status == 2)
                cout << "❌ Suspicious";
            else if (row.status == 1)
                cout << "⚠ Alert";
            else
                cout << "✅ Normal";
            cout << "\n";
        }

        cout << "══════════════════════════════════════════════════════\n";
        cout << "End of Report for " << target_date << "\n";
        cout << "══════════════════════════════════════════════════════\n";
    } else {
        cout << "\nDetailed summary skipped.\n";
        cout << "══════════════════════════════════════════════════════\n";
    }
}

void writerisksummary(const string& acc_id, double riskscore, int final){
    ofstream fout("riskscore.txt", ios::app);

    fout << acc_id << "|"
         << fixed << setprecision(2) << riskscore << "|"
         << (final == 2 ? "Suspicious" :
             final == 1 ? "Alert" : "Normal")
         << "\n";

    fout.close();

}

void accountwiseanalysis() {
    string acc_id;
    cout << "Enter the Account ID for analyze (ACCXXXX): ";
    cin >> acc_id;
    acc_id = trim(acc_id);

    if (accounts.empty()) {
        cout << "\n⚠ No accounts loaded. Loading now...\n";
        loadaccounts();
    }

    if (accounts.find(acc_id) == accounts.end()) {
        cout << "\n⚠ No records found for account: " << acc_id << endl;
        cout << "Available Accounts:\n";
        for (auto &it : accounts)
            cout << " - " << it.first << " (" << it.second.size() << " transactions)\n";
        return;
    }

    vector<Transaction> tx = accounts[acc_id];

    cout << "\n\n FRAUD DETECTION SUMMARY - ACCOUNT: " << acc_id << endl;
    cout << "----------------------------------------------------------\n";

    // ---------------- FRAUD CHECKS --------------------
    double days_diff = computeDaysRange(tx);
    pair<int, int> period = analyseperiod(tx, days_diff);
    int resultPeriod = period.first;      
    int highValueCount = period.second;  

    int resultTime = analysetime(tx);    
    int resultLoc  = analyzelocation(tx); 

    int finalResult = max({resultPeriod, resultTime, resultLoc});

    cout << "Total Transactions     : " << tx.size() << endl;
    cout << "High-Value Alerts      : " << highValueCount << endl;
    cout << "Analysis Period (days) : " << (int)ceil(days_diff) + 1 << endl;
    cout << "----------------------------------------------------------\n";

    cout << "Account Status         : ";
    if (finalResult == 2)
        cout << "❌ Suspicious\n";
    else if (finalResult == 1)
        cout << "⚠ Alert\n";
    else
        cout << "✅ Normal\n";

    cout << "----------------------------------------------------------\n";

    // ---------------- RISK SCORE (0-10) --------------------
    int cappedHigh = min(3, highValueCount); 
    int current_sum = resultPeriod + resultTime + resultLoc + cappedHigh;

    const int MAX_SUM = 9; 

    double riskScore = (current_sum / (double)MAX_SUM) * 10.0;

    cout << fixed << setprecision(2);
    cout << "Computed Risk Score    : " << riskScore << " / 10\n";
    cout << "Current Sum            : " << current_sum << endl;
    cout << "Maximum Possible       : " << MAX_SUM << endl;
    cout << "----------------------------------------------------------\n";

    // ---------------- DETAILED REPORT --------------------
    char choice;
    cout << "Do you want to view detailed transaction report? (Y/N): ";
    cin >> choice;

    if (choice == 'Y' || choice == 'y') {
        cout << "\nDetailed Transactions for Account " << acc_id << endl;
        cout << "----------------------------------------------------------\n";
        cout << left << setw(10) << "Txn ID"
             << " | " << setw(12) << "Date"
             << " | " << setw(8)  << "Time"
             << " | " << setw(10) << "Amount"
             << " | " << setw(10) << "Location" << endl;
        cout << "----------------------------------------------------------\n";

        for (auto &t : tx) {
            cout << left << setw(10) << t.trans_id
                 << " | " << setw(12) << t.date
                 << " | " << setw(8)  << t.time
                 << " | " << setw(10) << t.amount
                 << " | " << setw(10) << t.location << endl;
        }
        cout << "----------------------------------------------------------\n";
    } else {
        cout << "Detailed report skipped.\n";
    }

    writerisksummary(acc_id,riskScore,finalResult);

    cout << "✅ Analysis complete for " << acc_id << ".\n";
}

void riskscores() {
    ifstream file("riskscore.txt");

    if (!file) {
        cout << "No risk scores available.\n";
        return;
    }

    cout << "\n📄 Risk Score Summary \n";
    cout << "-------------------------------------------\n";
    cout << left << setw(12) << "Account"
         << setw(10) << "Score"
         << "Status\n";
    cout << "-------------------------------------------\n";

    string line;
    while (getline(file, line)) {
        if (line.empty()) continue;

        stringstream ss(line);
        string acc, score, type;

        getline(ss, acc, '|');
        getline(ss, score, '|');
        getline(ss, type); // last field

        cout << left << setw(12) << acc
             << setw(10) << score
             << type << "\n";
    }

    cout << "-------------------------------------------\n";
    file.close();
}

void viewAccountRiskHistory() {
    string acc;
    cout << "Enter Account ID to view risk history: ";
    cin >> acc;
    acc = trim(acc);

    ifstream file("riskscore.txt");
    if (!file) {
        cout << "No risk scores available (riskscore.txt).\n";
        return;
    }
    cout << "\nRisk history for " << acc << "\n";
    cout << "────────────────────────────────\n";
    string line;
    bool found = false;
    while (getline(file, line)) {
        if (line.empty()) continue;
        stringstream ss(line);
        string a, score, status;
        getline(ss, a, '|');
        getline(ss, score, '|');
        getline(ss, status);
        if (trim(a) == acc) {
            cout << "Score: " << trim(score) << " | " << trim(status) << "\n";
            found = true;
        }
    }
    if (!found) cout << "No entries found for this account.\n";
    cout << "────────────────────────────────\n";
    file.close();
}

void networkRelationshipAnalysis() {
    cout << "\n\n🌐 NETWORK / RELATIONSHIP ANALYSIS (Graph Mode)\n";
    cout << "────────────────────────────────────────────────────────\n";

    if (accounts.empty()) {
        cout << "⚠ No accounts loaded.\n";
        return;
    }

    unordered_map<string, vector<string>> graph;
    unordered_map<string, vector<string>> reasonMap;
    unordered_set<string> addedEdges;

    vector<Transaction> all;
    for (auto &p : accounts)
        for (auto &t : p.second)
            all.push_back(t);

    for (int i = 0; i < (int)all.size(); i++) {
        for (int j = i + 1; j < (int)all.size(); j++) {

            Transaction A = all[i];
            Transaction B = all[j];

            if (A.acc_id == B.acc_id) continue;

            bool suspicious = false;
            vector<string> reasons;

            // Convert amounts
            long long amtA = stoll(A.amount);
            long long amtB = stoll(B.amount);

            // TIME DIFFERENCE
            int diff = 99999;
            if (A.date == B.date)
                diff = timeDiffMinutes(A.time, B.time);

            // 1️⃣ HIGH VALUE (>= 2 lakh)
            if (A.date == B.date && amtA >= 200000 && amtB >= 200000) {
                suspicious = true;
                reasons.push_back("High-value ≥ 2 lakh same day");
            }

            // 2️⃣ TIME SUSPICIOUS (<= 10 min)
            if (A.date == B.date && diff <= 10) {
                suspicious = true;
                reasons.push_back("Time difference ≤ 10 min");
            }

            // 3️⃣ LOCATION SUSPICIOUS (DIFFERENT CITY + <= 15 min)
            if (A.date == B.date && A.location != B.location && diff <= 15) {
                suspicious = true;
                reasons.push_back("Different cities ≤ 15 min");
            }

            if (suspicious) {
                // Normalize key
                string edgeKey = (A.acc_id < B.acc_id)
                                 ? A.acc_id + "-" + B.acc_id
                                 : B.acc_id + "-" + A.acc_id;

                // Add edge only once
                if (!addedEdges.count(edgeKey)) {
                    graph[A.acc_id].push_back(B.acc_id);
                    graph[B.acc_id].push_back(A.acc_id);
                    addedEdges.insert(edgeKey);
                }

                // Add reasons (unique)
                for (string &r : reasons) {
                    auto &vec = reasonMap[edgeKey];
                    if (find(vec.begin(), vec.end(), r) == vec.end())
                        vec.push_back(r);
                }
            }
        }
    }

    if (graph.empty()) {
        cout << "No suspicious relationships detected.\n";
        return;
    }

    cout << "\n📌 Suspicious Relationship Graph\n";
    for (auto &g : graph) {
        cout << g.first << " → ";
        for (auto &nb : g.second) cout << nb << " ";
        cout << "\n";
    }

    cout << "\n🔍 Reasons for each connection:\n";
    for (auto &p : reasonMap) {
        cout << p.first << " : ";
        for (auto &r : p.second) cout << r << "; ";
        cout << "\n";
    }

    cout << "\n🕸 SUSPICIOUS CLUSTERS IDENTIFIED\n";

    unordered_map<string, bool> visited;

    for (auto &node : graph) {
        string start = node.first;

        if (!visited[start]) {
            vector<string> cluster;
            queue<string> q;

            q.push(start);
            visited[start] = true;

            while (!q.empty()) {
                string curr = q.front(); q.pop();
                cluster.push_back(curr);

                for (auto &nbr : graph[curr]) {
                    if (!visited[nbr]) {
                        visited[nbr] = true;
                        q.push(nbr);
                    }
                }
            }

            if (cluster.size() >= 2) {
                cout << "🔴 Suspicious Cluster: ";
                for (auto &acc : cluster) cout << acc << " ";
                cout << "\n";
            }
        }
    }

    cout << "\nAnalysis Completed.\n";
}


int main(){
#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);
#endif

    loadaccounts();

    int choice;

    do {
        cout << "\n\nMAIN MENU\n";
        cout << "1. Load Transactions (summary)\n";
        cout << "2. Generate Daily Summary (Date-wise Report)\n";
        cout << "3. Search by Account ID (Account analysis)\n";
        cout << "4. View Top 3 High-Risk Accounts\n";
        cout << "5. View Account Risk History\n";
        cout << "6. Network / Relationship Analysis (Graph Mode)\n";
        cout << "7. Exit\n";
        cout << "Choose: ";

        cin >> choice;

        switch(choice){
            case 1:
                loadalltransactions();
                break;
            case 2:
                datewiseanalysis();
                break;
            case 3:
                accountwiseanalysis();
                break;
            case 4:
                riskscores();
                break;
            case 5:
                viewAccountRiskHistory();
                break;
             case 6:
                networkRelationshipAnalysis();
                break;
            case 7:
                cout << "Exiting...\n";
                break;
            default:
                cout << "Invalid choice. Try again.\n";
        }

    } while(choice != 7);

    return 0;
}
