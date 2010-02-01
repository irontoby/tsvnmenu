var TsvnMenu = {
    prefBranch: "tsvnmenu.",
    prefTprocPath: "tproc_path",
    
    init: function() {
    
        this.initialized = false;

        var menu = document.getElementById("contentAreaContextMenu");
        
        if (menu) {
            menu.addEventListener("popupshowing",
                tsvnmenuContextListener, false);
        }

        this.tsvnMenuItems = new Array("tsvnmenu-topmenu", "tsvnmenu-topsep");
        
        if (this.findTprocPath()) this.initialized = true;
        
        return(this.initialized);
    },
    
    findTprocPath: function() {
        try {
            var prefservice = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefService);
            
            var prefs = prefservice.getBranch(this.prefBranch);
            
            if (prefs != null && (prefs.getPrefType(this.prefTprocPath) == prefs.PREF_STRING)) {
                this.tprocPath = prefs.getCharPref(this.prefTprocPath);
            }
            
            if (this.tprocPath == null || this.tprocPath == '') {
                this.tprocPath = this.getTsvnProcDirFromReg();
                
                if(this.tprocPath == null) {
                    this.tprocPath = this.getTsvnProcDefaultDir();
                }
                
                this.tprocPath += '\\bin\\TortoiseProc.exe';
                
                if(prefs != null) {
                    prefs.setCharPref(this.prefTprocPath, this.tprocPath);
                }
            }
            
        } catch (e) {
            this.doError("Can't find TortoiseProc.exe");
            return(false);
        }
        
        return(true);
    },
    
    getTsvnProcDirFromReg: function() {
        var tsvnDir;
        var reg;
        
        try {
            reg = Components.classes['@mozilla.org/windows-registry-key;1'].
                createInstance(Components.interfaces.nsIWindowsRegKey);
            
            if(reg == null) {
                return(null);
            }
            
            try {
                reg.open(reg.ROOT_KEY_LOCAL_MACHINE, 'Software\\TortoiseSVN',
                    reg.ACCESS_QUERY_VALUE);
            } catch(e) {
                reg.open(reg.ROOT_KEY_LOCAL_MACHINE, 'Software\\TortoiseSVN',
                    reg.ACCESS_QUERY_VALUE | 0x0100);
            }
            
            // TODO: Read 'ProcPath' value instead if avail
            tsvnDir = reg.readStringValue('Directory').replace(/\\$/, "");
            
        } catch(e) {
            // TODO: use file picker here?
            return(null);
        }
        
        try {
            reg.close();
        } catch(e) {
        }

        if (tsvnDir == null || tsvnDir == "") {
            return(null);
        }
        
        return(tsvnDir);
    },
    
    getTsvnProcDefaultDir: function() {
        return('C:\\Program Files\\TortoiseSVN');
    },
    
    doContext: function() {
        if (!gContextMenu) return(false);
        var tsvnHidden = (! gContextMenu.onLink);
        
        var i;
        var menuitem = null;
        
        for(i = 0; i < this.tsvnMenuItems.length; i++) {
            menuitem = document.getElementById(this.tsvnMenuItems[i]);
            if (menuitem) menuitem.hidden = tsvnHidden;
        }
        
        return(true);
    },
    
    doTortoiseProc: function(command, path, url) {

        this.findTprocPath();
        
        var tprocExe = Components.classes['@mozilla.org/file/local;1'].
            createInstance(Components.interfaces.nsILocalFile);
        
        try {
            tprocExe.initWithPath(this.tprocPath);
        } catch(e) {
            this.doError("Can't initialize TortoiseProc call");
            return(false);
        }
        
        if (! tprocExe.exists()) {
            this.doError("TortoiseProc.exe does not exist at " + this.tprocPath);
            return(false);
        }
        
        try {
            var process = Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
            process.init(tprocExe);
            
            var args = ['/command:' + command];
            if (url != null) args.push('/url:' + url);
            if (path != null) args.push('/path:' + path);
            args.push('/notempfile');
            
            process.run(false, args, args.length,{});
            
            return(true);
        } catch(e) {
            this.doError("Couldn't launch TortoiseProc.exe from " + this.tprocPath);
        }
        
        return(false);

    },
    
    // http://tortoisesvn.sourceforge.net/docs/release/TortoiseSVN_en/apc.html
    
    doTsvnCheckout: function() {
        this.doTortoiseProc('checkout', null, this.contextLinkURL());
    },
    
    doTsvnShowLog: function() {
        this.doTortoiseProc('log', this.contextLinkURL());
    },
    
    doTsvnRepoBrowser: function() {
        this.doTortoiseProc('repobrowser', this.contextLinkURL());
    },
    
    doTsvnRename: function() {
        this.doTortoiseProc('rename', this.contextLinkURL());
    },
    
    doTsvnDelete: function() {
        this.doTortoiseProc('remove', this.contextLinkURL());
    },
    
    doTsvnCopy: function() {
        this.doTortoiseProc('copy', this.contextLinkURL());
    },
    
    doTsvnExport: function() {
        this.doTortoiseProc('export', this.contextLinkURL());
    },
    
    doTsvnBlame: function() {
        this.doTortoiseProc('blame', this.contextLinkURL());
    },
    
    doTsvnHelp: function() {
        this.doTortoiseProc('help');
    },
    
    doTsvnSettings: function() {
        this.doTortoiseProc('settings');
    },
    
    doTsvnAbout: function() {
        this.doTortoiseProc('about');
    },
    
    contextLinkURL: function() {
        try {
            if (gContextMenu && gContextMenu.getLinkURL) {
            	return(gContextMenu.getLinkURL());
            } else if (gContextMenu && gContextMenu.linkURL) {
            	return(gContextMenu.linkURL());
            }
        } catch(e) {}
        
        return(null);
    },

    doError: function(msg) {
    //TODO: be less intrusive about error message?
        alert('TSVNMenu Extension ERROR: ' + msg);
        return(false);
    }

};

window.addEventListener("load", function(e) { TsvnMenu.init(e); }, false);
 
function tsvnmenuContextListener(e) {
    return(TsvnMenu.doContext(e));
}
