# PT站点魔力计算器

在使用NexusPHP架构的PT站点种子和当前做种列表的B值|A值|每GB的A值。

### 功能

1）在种子列表界面显示该种子的B值|A值|每GB的A值；
2）在当前做种列表中显示该种子的B值|A值|每GB的A值；
每个B值不准确，因公式是对所有A求和后再计算B，每个种子的B值与时魔B值并非线性关系，这里仅供参考。
A/GB表征对磁盘空间利用的性价比。如果每GB的A值超过2并且没有断种会被自动标红。

特别地，对于断种的种子，直接显示为续种后孤种状态的实际A值。
![](https://s2.loli.net/2022/02/04/TqnG9itOVvYpIwh.png)

在魔力公式页面显示 B - A 关系图。注意：B值不等于每小时的魔力值，B值 + 种子数奖励 + 其他加成 的和才等于每小时的魔力值。

![](https://s2.loli.net/2022/02/04/kLu13N2l87zYTBa.png)

### 使用

脚本安装：
管理面板>实用工具>从URL安装
填写：https://raw.githubusercontent.com/jinhill/pt-bonus-calc/main/ptbonus.js

首次使用须打开各站的魔力值公式或商店页面获取魔力计算公式的参数，否则无法计算。参数保存在管理面板->已安装脚本->本脚本->编辑->存储。
当前做种的魔力值计算采用异步请求种子详情页获取种子存活时间并缓存，由各站可能有防止频繁访问策略，脚本采用延时1500ms访问一次的策略，如果当前做种数较多，多刷新几次当前页面即可，后续再次展示从缓存获取。


### Credit
基于neoblackxt的[PTMyBonusCalc魔力计算器](https://github.com/neoblackxt/PTMyBonusCalc)修改

### 开源协议

GPL v3
