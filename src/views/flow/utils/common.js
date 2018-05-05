let nextIndex;
let searchValue;
export default function findInPage(targetEle, searchText) {  
  nextIndex = 0;
  //在整个文本中查找第几个，从0开始  
  searchValue = '';
  //上一次需要查找的字符串  
    //判断搜索字符是否为空  
    if (!searchText) {
      return false;
    }
    //判断搜索条件是否已经改变  
    if (searchText && searchText != searchValue && nextIndex > 0) {
      searchValue = searchText;
      nextIndex = 0;
    } else {
      searchValue = searchText;
    }

    if (document.all) {
      txt = targetEle.createTextRange();
      //搜索str  
      var found = '';
      //查找第nextIndex个的字符串。之所以要用循环，是因为TextRange对象每次都是新生成的，所以查找初始位置每次都会还原。那么要查找第n次出现的字符串，就需要调用findText()方法多次，且每次查找都要重新设置开始位置和结束位置。  
      for (i = 0; i <= nextIndex && (found = txt.findText(searchValue)) == true; i++) {
        txt.moveStart("character", 1);
        txt.moveEnd("textedit");
      }
      //选中本次查找的字符串  
      if (found) {
        //这里设置为-1，表示为倒序查找。之所以要这样做，是因为此时我们已经查找到了第nextIndex出现的字符串，那么此时如果设置为倒序查找，且将开始位置设置为末尾，那么此时调用findText()方法查找，则会刚好查到我们上一次查到的字符串  
        txt.moveStart("character", -1);
        txt.findText(searchValue);
        txt.select();
        //滚动屏幕到合适位置  
        txt.scrollIntoView();
        nextIndex++;
      } else {
        //循环查找  
        if (nextIndex > 0) {
          nextIndex = 0;
          findInPage(searchValue);
        }
      }
    } else {
      //谷歌循环查找  
      window.find(searchValue, false, true);
    }
  }
